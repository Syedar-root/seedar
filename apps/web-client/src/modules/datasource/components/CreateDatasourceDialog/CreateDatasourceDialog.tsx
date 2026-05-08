import { DatasourceFormDialog } from "../DatasourceFormDialog";

interface CreateDatasourceDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (datasourceId: number) => void;
}

export const CreateDatasourceDialog: React.FC<CreateDatasourceDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  return (
    <DatasourceFormDialog
      open={open}
      mode="create"
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};
