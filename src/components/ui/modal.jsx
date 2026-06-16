/**
 * Modal — app-canonical primitive backed by HeroUI v3 (React Aria dialog).
 *
 * Trigger-driven:
 *   <Modal>
 *     <ModalTrigger><Button>Open</Button></ModalTrigger>
 *     <ModalDialog>
 *       <ModalHeader><ModalHeading>Title</ModalHeading></ModalHeader>
 *       <ModalBody>…</ModalBody>
 *       <ModalFooter>…</ModalFooter>
 *     </ModalDialog>
 *   </Modal>
 *
 * Controlled: pass `state` from useModalState()/useOverlayTriggerState, or use
 * `isOpen` / `onOpenChange` on <Modal>.
 */
export {
  Modal,
  ModalTrigger,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalHeading,
  ModalBody,
  ModalFooter,
  ModalIcon,
  ModalCloseTrigger,
} from "@heroui/react";
