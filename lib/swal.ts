'use client';

/**
 * Helpers de SweetAlert2 con el tema oscuro/neon de TicketChain.
 * Centraliza alertas, toasts y confirmaciones para que todo el dashboard
 * comparta el mismo estilo (los estilos viven en app/globals.css, clases .swal-tc-*).
 */
import Swal from 'sweetalert2';

type Icono = 'success' | 'error' | 'info' | 'warning' | 'question';

/** Escapa texto del usuario antes de inyectarlo como HTML en una alerta. */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

/** Diálogo modal base (confirmaciones, cargas...). */
const modal = Swal.mixin({
  background: '#12121a',
  color: '#e2e8f0',
  buttonsStyling: false,
  customClass: {
    popup: 'swal-tc-popup',
    title: 'swal-tc-title',
    htmlContainer: 'swal-tc-text',
    actions: 'swal-tc-actions',
    confirmButton: 'swal-tc-confirm',
    cancelButton: 'swal-tc-cancel',
  },
});

/** Toast discreto en la esquina superior derecha (reemplaza a sonner). */
const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2800,
  timerProgressBar: true,
  background: '#12121a',
  color: '#e2e8f0',
  customClass: { popup: 'swal-tc-toast', title: 'swal-tc-toast-title' },
  didOpen: (el) => {
    el.addEventListener('mouseenter', Swal.stopTimer);
    el.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

/** Notificación tipo toast. */
export function notify(icon: Icono, title: string) {
  return toast.fire({ icon, title });
}

/** Confirmación de borrado con botón rojo. Devuelve true si el usuario confirma. */
export function confirmDelete(nombre: string): Promise<boolean> {
  return modal
    .fire({
      icon: 'warning',
      title: 'Eliminar evento',
      html:
        `¿Seguro que quieres eliminar <b style="color:#f87171">${escapeHtml(nombre)}</b>?` +
        `<br/><span style="color:#64748b;font-size:13px">Se borrará el banner y la metadata NFT. Esta acción no se puede deshacer.</span>`,
      showCancelButton: true,
      focusCancel: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'swal-tc-popup',
        title: 'swal-tc-title',
        htmlContainer: 'swal-tc-text',
        actions: 'swal-tc-actions',
        confirmButton: 'swal-tc-danger', // botón rojo de borrado
        cancelButton: 'swal-tc-cancel',
      },
    })
    .then((r) => r.isConfirmed);
}

/** Muestra un overlay de carga (bloqueante). Cerrar con closeAlert(). */
export function showLoading(title = 'Procesando...') {
  modal.fire({
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading(),
  });
}

/** Cierra cualquier alerta abierta. */
export function closeAlert() {
  Swal.close();
}
