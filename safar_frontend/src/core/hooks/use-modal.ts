import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/core/store';
import { openModal, closeModal } from '@/core/features/ui/modal-slice';
import { ModalType, ModalData } from '@/core/features/ui/modal-slice';

export const useModal = () => {
  const dispatch = useDispatch();
  const modalState = useSelector((state: RootState) => state.modal);

  const onOpen = (type: ModalType, data?: ModalData) => {
    dispatch(openModal({ type, data }));
  };

  const onClose = () => {
    dispatch(closeModal());
  };

  return {
    type: modalState.type,
    data: modalState.data,
    isOpen: modalState.isOpen,
    onOpen,
    onClose,
  };
};