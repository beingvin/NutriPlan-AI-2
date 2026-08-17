import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  uploadFileToDrive,
  listDietPlanDriveFiles,
  downloadDriveFileContent,
  deleteDriveFile,
  DriveFile,
} from '../lib/googleDriveService';
import { PantryItem, WeeklyMealPlan } from '../types';
import {
  FolderKanban,
  CloudUpload,
  CloudDownload,
  Trash2,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: PantryItem[];
  setInventory: React.Dispatch<React.SetStateAction<PantryItem[]>>;
  plan: WeeklyMealPlan | null;
  setPlan: (plan: WeeklyMealPlan) => void;
  showToast: (msg: string) => void;
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({
  isOpen,
  onClose,
  inventory,
  setInventory,
  plan,
  setPlan,
  showToast,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Confirmation dialog state for destructive action (deleting file from Drive)
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<DriveFile | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setLoadingAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setLoadingAuth(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const fetchDriveFiles = async () => {
    if (!token) return;
    setLoadingFiles(true);
    try {
      const files = await listDietPlanDriveFiles();
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Fetch Drive files error:', err);
      setActionStatus(`Error fetching Drive files: ${err.message}`);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (user && token && isOpen) {
      fetchDriveFiles();
    }
  }, [user, token, isOpen]);

  const handleSignIn = async () => {
    setBusy(true);
    setActionStatus(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        showToast('Successfully connected to Google Drive!');
      }
    } catch (err: any) {
      setActionStatus(`Sign-in failed: ${err.message || 'Popup closed or access denied'}`);
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    await googleSignOut();
    setUser(null);
    setToken(null);
    setDriveFiles([]);
    showToast('Signed out from Google Drive.');
  };

  const handleBackupPantry = async () => {
    if (!token) return;
    setBusy(true);
    setActionStatus('Backing up pantry inventory to Google Drive...');
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `DietPlan_Pantry_Backup_${dateStr}.json`;
      const payload = JSON.stringify({
        app: 'DietPlan AI',
        type: 'pantry_backup',
        createdAt: new Date().toISOString(),
        itemCount: inventory.length,
        inventory: inventory,
      }, null, 2);

      await uploadFileToDrive(fileName, payload, 'application/json');
      showToast(`Pantry inventory backed up to Google Drive as ${fileName}!`);
      setActionStatus(`Successfully uploaded ${fileName}`);
      await fetchDriveFiles();
    } catch (err: any) {
      setActionStatus(`Backup failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleBackupMealPlan = async () => {
    if (!plan) {
      setActionStatus('No 7-day meal plan generated yet to backup.');
      return;
    }
    if (!token) return;

    setBusy(true);
    setActionStatus('Backing up 7-day meal plan to Google Drive...');
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `DietPlan_MealPlan_${dateStr}.json`;
      const payload = JSON.stringify({
        app: 'DietPlan AI',
        type: 'meal_plan_backup',
        createdAt: new Date().toISOString(),
        mealPlan: plan,
      }, null, 2);

      await uploadFileToDrive(fileName, payload, 'application/json');
      showToast(`Meal plan backed up to Google Drive as ${fileName}!`);
      setActionStatus(`Successfully uploaded ${fileName}`);
      await fetchDriveFiles();
    } catch (err: any) {
      setActionStatus(`Backup failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleExportTextSummary = async () => {
    if (!plan) {
      setActionStatus('No 7-day meal plan available to export.');
      return;
    }
    if (!token) return;

    setBusy(true);
    setActionStatus('Exporting readable meal plan text summary to Google Drive...');
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `DietPlan_MealPlan_Summary_${dateStr}.txt`;

      let summaryText = `DietPlan AI - 7-Day Vegetarian Meal Plan Summary\nGenerated: ${new Date().toLocaleString()}\n\n`;
      summaryText += `NUTRITIONAL TARGETS:\n`;
      summaryText += `- Daily Calorie Target: ${plan.weeklyMacroSummary?.avgDailyCalories || 1800} kcal\n`;
      summaryText += `- Daily Protein Target: ${plan.weeklyMacroSummary?.avgDailyProteinGrams || 80} g\n`;
      summaryText += `- Estimated Weekly Grocery Budget: ₹${plan.weeklyMacroSummary?.estimatedGroceryCostInr || 1200}\n\n`;

      plan.days.forEach((day) => {
        summaryText += `========================================\n`;
        summaryText += `${day.dayName.toUpperCase()} (${day.theme})\n`;
        summaryText += `========================================\n`;
        summaryText += `• Breakfast: ${day.breakfast.name} (${day.breakfast.proteinGrams}g Protein)\n  Recipe: ${day.breakfast.recipeOverview}\n\n`;
        summaryText += `• Lunch: ${day.lunch.name} (${day.lunch.proteinGrams}g Protein)\n  Recipe: ${day.lunch.recipeOverview}\n\n`;
        summaryText += `• Dinner: ${day.dinner.name} (${day.dinner.proteinGrams}g Protein)\n  Recipe: ${day.dinner.recipeOverview}\n\n`;
        summaryText += `• Snacks: ${day.snacks.name} (${day.snacks.proteinGrams}g Protein)\n  Recipe: ${day.snacks.recipeOverview}\n\n`;
      });

      await uploadFileToDrive(fileName, summaryText, 'text/plain');
      showToast(`Exported readable text summary to Google Drive as ${fileName}!`);
      setActionStatus(`Successfully exported ${fileName}`);
      await fetchDriveFiles();
    } catch (err: any) {
      setActionStatus(`Export failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleRestoreFile = async (file: DriveFile) => {
    setBusy(true);
    setActionStatus(`Downloading ${file.name} from Google Drive...`);
    try {
      const contentText = await downloadDriveFileContent(file.id);
      const data = JSON.parse(contentText);

      if (data.type === 'pantry_backup' && Array.isArray(data.inventory)) {
        setInventory(data.inventory);
        showToast(`Restored ${data.inventory.length} pantry items from Google Drive!`);
        setActionStatus(`Restored pantry stock from ${file.name}`);
      } else if (data.type === 'meal_plan_backup' && data.mealPlan) {
        setPlan(data.mealPlan);
        showToast(`Restored 7-day meal plan from Google Drive!`);
        setActionStatus(`Restored meal plan from ${file.name}`);
      } else {
        setActionStatus(`Unrecognized file structure in ${file.name}.`);
      }
    } catch (err: any) {
      setActionStatus(`Failed to restore file: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteFile) return;
    const fileToDelete = confirmDeleteFile;
    setConfirmDeleteFile(null);

    setBusy(true);
    setActionStatus(`Deleting ${fileToDelete.name} from Google Drive...`);
    try {
      await deleteDriveFile(fileToDelete.id);
      showToast(`Deleted ${fileToDelete.name} from Google Drive.`);
      setActionStatus(`Deleted ${fileToDelete.name}`);
      await fetchDriveFiles();
    } catch (err: any) {
      setActionStatus(`Failed to delete file: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Google Drive Integration</h2>
              <p className="text-xs text-slate-500">
                Backup, export, and restore your meal plans & pantry stock
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Auth State Card */}
          {loadingAuth ? (
            <div className="p-6 text-center text-slate-500 flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Checking Google authentication status...</span>
            </div>
          ) : !user ? (
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-5 text-center space-y-3">
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="font-bold text-slate-900 text-sm">Connect your Google Account</h3>
                <p className="text-slate-600 text-xs">
                  Sign in with Google to securely save your 7-day vegetarian diet plans, grocery lists, and pantry backups directly to your Google Drive.
                </p>
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  onClick={handleSignIn}
                  disabled={busy}
                  className="gsi-material-button bg-white hover:bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 shadow-2xs transition-all flex items-center space-x-3 text-slate-700 font-semibold text-xs"
                >
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span>Sign in with Google Drive</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-9 h-9 rounded-full border border-emerald-300" />
                ) : (
                  <div className="w-9 h-9 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {user.displayName?.[0] || 'U'}
                  </div>
                )}
                <div>
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <span>{user.displayName || user.email}</span>
                    <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Drive Active
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">{user.email}</div>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="text-slate-600 hover:text-red-600 hover:bg-white/80 p-2 rounded-xl transition-all border border-transparent hover:border-slate-200 flex items-center space-x-1 font-semibold"
                title="Disconnect Google Drive"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}

          {/* Action Status Banner */}
          {actionStatus && (
            <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between text-xs animate-fade-in">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{actionStatus}</span>
              </div>
              <button onClick={() => setActionStatus(null)} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Backup & Export Actions (Visible when signed in) */}
          {user && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-500">
                Backup & Export Options
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={handleBackupPantry}
                  disabled={busy}
                  className="bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-xl text-left transition-all shadow-2xs group hover:border-emerald-500 disabled:opacity-50"
                >
                  <div className="flex items-center space-x-2 text-emerald-700 font-bold mb-1">
                    <CloudUpload className="w-4 h-4" />
                    <span>Backup Pantry Stock</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Save current {inventory.length} items to Google Drive JSON
                  </p>
                </button>

                <button
                  onClick={handleBackupMealPlan}
                  disabled={busy || !plan}
                  className="bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-xl text-left transition-all shadow-2xs group hover:border-blue-500 disabled:opacity-50"
                >
                  <div className="flex items-center space-x-2 text-blue-700 font-bold mb-1">
                    <CloudUpload className="w-4 h-4" />
                    <span>Backup 7-Day Plan</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {plan ? 'Save full 7-day meal plan JSON' : 'No plan generated yet'}
                  </p>
                </button>

                <button
                  onClick={handleExportTextSummary}
                  disabled={busy || !plan}
                  className="bg-white hover:bg-slate-50 border border-slate-200 p-3 rounded-xl text-left transition-all shadow-2xs group hover:border-indigo-500 disabled:opacity-50"
                >
                  <div className="flex items-center space-x-2 text-indigo-700 font-bold mb-1">
                    <FileText className="w-4 h-4" />
                    <span>Export Meal Doc</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Export readable text summary with recipes
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Drive Files List */}
          {user && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-500">
                  DietPlan Files in Google Drive
                </h3>
                <button
                  onClick={fetchDriveFiles}
                  disabled={loadingFiles}
                  className="text-slate-500 hover:text-slate-900 flex items-center space-x-1 font-medium"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingFiles ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {loadingFiles ? (
                <div className="p-6 text-center text-slate-400">Loading files from Google Drive...</div>
              ) : driveFiles.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 bg-slate-50/50">
                  No DietPlan backups found in your Google Drive yet. Click one of the backup buttons above to save your first file!
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {driveFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 rounded-xl flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
                          {file.name.endsWith('.txt') ? (
                            <FileText className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <CloudDownload className="w-4 h-4 text-emerald-600" />
                          )}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-slate-800 truncate">{file.name}</div>
                          <div className="text-[10px] text-slate-400">
                            Modified: {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Recent'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {file.name.endsWith('.json') && (
                          <button
                            onClick={() => handleRestoreFile(file)}
                            disabled={busy}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors flex items-center space-x-1 shadow-2xs"
                            title="Restore content from Drive"
                          >
                            <CloudDownload className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>
                        )}

                        <button
                          onClick={() => setConfirmDeleteFile(file)}
                          disabled={busy}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-white transition-colors"
                          title="Delete file from Google Drive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-slate-500 text-[11px]">
          <span>Protected with OAuth 2.0 Client Token Authentication</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Explicit Destructive Action Confirmation Modal */}
      {confirmDeleteFile && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-red-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Delete File from Google Drive?</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Are you sure you want to permanently delete <strong className="text-slate-900">"{confirmDeleteFile.name}"</strong> from your Google Drive? This operation cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setConfirmDeleteFile(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-2xs flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
