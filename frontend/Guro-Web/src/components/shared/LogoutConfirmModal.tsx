import React from 'react';
import { LogOut } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] transition-opacity duration-300">
      <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl transform scale-100 transition-transform duration-300">
        {/* Icon */}
        <div className="flex items-center justify-center w-14 h-14 bg-[#A01322]/10 border border-[#A01322]/20 rounded-full mx-auto mb-4">
          <LogOut className="w-6 h-6 text-[#A01322]" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-extrabold text-zinc-100 text-center mb-2 tracking-tight">
          Confirm Logout
        </h3>

        {/* Description */}
        <p className="text-zinc-400 text-sm text-center mb-6 leading-relaxed">
          Are you sure you want to log out? You will need to sign in again to access your session.
        </p>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-3 border border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-zinc-300 rounded-2xl hover:bg-zinc-900 transition-all font-semibold text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-5 py-3 bg-[#A01322] hover:bg-[#A01322]/90 text-white rounded-2xl hover:shadow-lg hover:shadow-[#A01322]/20 transition-all font-semibold text-sm cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};
