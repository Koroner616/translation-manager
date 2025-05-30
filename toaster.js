/**
 * Toaster - Sistema de notificaciones moderno
 * Un componente ligero para mostrar mensajes tipo toast en la aplicación
 */
class Toaster {
  constructor(options = {}) {
    this.options = {
      position: options.position || 'bottom-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
      duration: options.duration || 3000,
      maxToasts: options.maxToasts || 5,
      pauseOnHover: options.pauseOnHover !== undefined ? options.pauseOnHover : true,
      closeButton: options.closeButton !== undefined ? options.closeButton : true,
      containerClass: options.containerClass || '',
      animations: options.animations !== undefined ? options.animations : true,
    };

    this.toasts = [];
    this.container = null;
    this.createContainer();
  }

  createContainer() {
    // Verificar si ya existe un contenedor
    const existingContainer = document.getElementById('toaster-container');
    if (existingContainer) {
      this.container = existingContainer;
      return;
    }

    // Crear el contenedor de toasts
    this.container = document.createElement('div');
    this.container.id = 'toaster-container';
    this.container.className = `toaster-container ${this.options.position} ${this.options.containerClass}`;
    document.body.appendChild(this.container);

    // Añadir estilos CSS si no están presentes
    if (!document.getElementById('toaster-styles')) {
      const style = document.createElement('style');
      style.id = 'toaster-styles';
      style.textContent = `
        .toaster-container {
          position: fixed;
          z-index: 9999;
          max-width: 350px;
          box-sizing: border-box;
          padding: 10px;
          pointer-events: none;
        }
        .toaster-container.top-right {
          top: 20px;
          right: 20px;
        }
        .toaster-container.top-left {
          top: 20px;
          left: 20px;
        }
        .toaster-container.bottom-right {
          bottom: 20px;
          right: 20px;
        }
        .toaster-container.bottom-left {
          bottom: 20px;
          left: 20px;
        }
        .toast {
          position: relative;
          margin-bottom: 10px;
          padding: 15px;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          color: white;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          opacity: 0;
          transform: translateY(15px);
          transition: all 0.3s ease;
          overflow: hidden;
          display: flex;
          align-items: center;
          pointer-events: auto;
        }
        .toast.show {
          opacity: 1;
          transform: translateY(0);
        }
        .toast.hide {
          opacity: 0;
          transform: translateY(-15px);
        }
        .toast-icon {
          margin-right: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .toast-content {
          flex: 1;
        }
        .toast-close {
          background: transparent;
          border: none;
          color: white;
          opacity: 0.7;
          cursor: pointer;
          font-size: 16px;
          margin-left: 10px;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }
        .toast-close:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.15);
        }
        .toast-success {
          background-color: #4caf50;
        }
        .toast-error {
          background-color: #f44336;
        }
        .toast-warning {
          background-color: #ff9800;
        }
        .toast-info {
          background-color: #2196f3;
        }
        .toast-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background-color: rgba(255, 255, 255, 0.5);
          width: 100%;
          transform-origin: left;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Muestra un mensaje toast
   * @param {string} message - El mensaje a mostrar
   * @param {object} options - Opciones para este toast específico
   */
  show(message, options = {}) {
    const toastOptions = {
      ...this.options,
      ...options,
      type: options.type || 'info', // 'success', 'error', 'warning', 'info'
      duration: options.duration !== undefined ? options.duration : this.options.duration,
      icon: options.icon !== undefined ? options.icon : true,
    };

    // Limitar el número de toasts si es necesario
    while (this.toasts.length >= this.options.maxToasts) {
      this.removeToast(this.toasts[0].id);
    }

    // Crear el elemento toast
    const toast = document.createElement('div');
    const id = 'toast-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    toast.id = id;
    toast.className = `toast toast-${toastOptions.type}`;
    toast.setAttribute('role', 'alert');

    // Estructura interna del toast
    let html = '<div class="toast-content">';

    // Icono (si está habilitado)
    if (toastOptions.icon) {
      let iconSvg = '';
      switch (toastOptions.type) {
        case 'success':
          iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
          break;
        case 'error':
          iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
          break;
        case 'warning':
          iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
          break;
        case 'info':
          iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
          break;
      }
      html = `<div class="toast-icon">${iconSvg}</div>` + html;
    }

    // Mensaje
    html += `<div>${message}</div></div>`;

    // Botón de cierre (si está habilitado)
    if (toastOptions.closeButton) {
      html += `<button class="toast-close" aria-label="Close">×</button>`;
    }

    // Barra de progreso (si la duración > 0)
    if (toastOptions.duration > 0) {
      html += `<div class="toast-progress"></div>`;
    }

    toast.innerHTML = html;

    // Agregar a la lista y al DOM
    this.container.appendChild(toast);

    // Tiempo para que el DOM se actualice
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Configurar la barra de progreso
    const progressBar = toast.querySelector('.toast-progress');
    if (progressBar && toastOptions.duration > 0) {
      progressBar.style.transition = `width ${toastOptions.duration / 1000}s linear`;
      setTimeout(() => {
        progressBar.style.width = '0%';
      }, 10);
    }

    // Establecer temporizador para eliminar el toast
    let timeoutId = null;
    if (toastOptions.duration > 0) {
      timeoutId = setTimeout(() => {
        this.removeToast(id);
      }, toastOptions.duration);
    }

    // Manejar eventos de hover si pauseOnHover está habilitado
    if (toastOptions.pauseOnHover) {
      toast.addEventListener('mouseenter', () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          if (progressBar) {
            progressBar.style.transition = 'none';
          }
        }
      });

      toast.addEventListener('mouseleave', () => {
        if (toastOptions.duration > 0) {
          const remainingTime = parseFloat(progressBar.style.width) / 100 * toastOptions.duration;
          if (progressBar) {
            progressBar.style.transition = `width ${remainingTime / 1000}s linear`;
            progressBar.style.width = '0%';
          }
          timeoutId = setTimeout(() => {
            this.removeToast(id);
          }, remainingTime);
        }
      });
    }

    // Manejar clic en botón de cierre
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.removeToast(id);
      });
    }

    // Añadir referencia del toast
    this.toasts.push({
      id,
      element: toast,
      timeoutId
    });

    return id;
  }

  /**
   * Elimina un toast específico
   * @param {string} id - ID del toast a eliminar
   */
  removeToast(id) {
    const index = this.toasts.findIndex(t => t.id === id);
    if (index === -1) return;

    const toast = this.toasts[index];

    // Limpiar el timeout si existe
    if (toast.timeoutId) {
      clearTimeout(toast.timeoutId);
    }

    // Animar la salida
    toast.element.classList.add('hide');
    toast.element.classList.remove('show');

    // Eliminar después de la animación
    setTimeout(() => {
      if (toast.element.parentNode) {
        toast.element.parentNode.removeChild(toast.element);
      }
      this.toasts.splice(index, 1);
    }, 300);
  }

  /**
   * Elimina todos los toasts actuales
   */
  clear() {
    this.toasts.forEach(toast => {
      if (toast.timeoutId) {
        clearTimeout(toast.timeoutId);
      }
      if (toast.element.parentNode) {
        toast.element.parentNode.removeChild(toast.element);
      }
    });
    this.toasts = [];
  }

  /**
   * Muestra un mensaje de éxito
   * @param {string} message - El mensaje a mostrar
   * @param {object} options - Opciones adicionales
   */
  success(message, options = {}) {
    return this.show(message, { ...options, type: 'success' });
  }

  /**
   * Muestra un mensaje de error
   * @param {string} message - El mensaje a mostrar
   * @param {object} options - Opciones adicionales
   */
  error(message, options = {}) {
    return this.show(message, { ...options, type: 'error' });
  }

  /**
   * Muestra un mensaje de advertencia
   * @param {string} message - El mensaje a mostrar
   * @param {object} options - Opciones adicionales
   */
  warning(message, options = {}) {
    return this.show(message, { ...options, type: 'warning' });
  }

  /**
   * Muestra un mensaje informativo
   * @param {string} message - El mensaje a mostrar
   * @param {object} options - Opciones adicionales
   */
  info(message, options = {}) {
    return this.show(message, { ...options, type: 'info' });
  }
}

// Exportar una instancia para uso global
const toast = new Toaster();

// Exponer tanto la clase como la instancia por defecto
window.Toaster = Toaster;
window.toast = toast;

// Para uso como módulo
export { Toaster, toast as default };