import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";

interface NoProjectsDialogProps {
  open: boolean;
}

export const NoProjectsDialog = ({ open }: NoProjectsDialogProps) => {
  const navigate = useNavigate();

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-6 w-6 text-primary" />
            <AlertDialogTitle className="text-2xl font-bold">STOREA</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base pt-2">
            No projects available. Create a project or join a project first to use this feature.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => navigate('/projects')}>
            Go to Projects
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
