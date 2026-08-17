import { useNavigate } from 'react-router';
import { useCarbonStore } from '../store/useCarbonStore';
import { LogOut } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function LogoutDialog() {
  const { isLogoutDialogOpen, setIsLogoutDialogOpen, logout } = useCarbonStore();
  const navigate = useNavigate();

  const handleConfirmLogout = async () => {
    await logout();
    setIsLogoutDialogOpen(false);
    navigate('/');
  };

  return (
    <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
      <DialogContent className="max-w-md p-6 text-left border-slate-200 gap-4">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <LogOut className="w-4 h-4 text-rose-500" />
            Konfirmasi Logout
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Apakah Anda yakin ingin keluar dari portal RekaKarbon?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none text-xs font-bold rounded-xl cursor-pointer"
            onClick={() => setIsLogoutDialogOpen(false)}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            className="flex-1 sm:flex-none text-xs font-bold rounded-xl gap-2 cursor-pointer"
            onClick={handleConfirmLogout}
          >
            <LogOut className="w-4 h-4" />
            Ya, Logout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
