import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { openModal, closeModal } from '@/redux/features/ui/modal-slice';
import { ModalType, ModalData } from '@/redux/features/ui/modal-slice';

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