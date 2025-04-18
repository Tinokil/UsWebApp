class ProductForm {
  constructor() {
      this.tg = window.Telegram?.WebApp;
      this.state = {
          isValid: false,
          isTelegram: !!window.Telegram?.WebApp
      };
      this.elements = {
          form: document.getElementById('productForm'),
          preview: document.getElementById('previewContent'),
          submitBtn: document.getElementById('submitBtn'),
          btnText: document.getElementById('btnText'),
          btnSpinner: document.getElementById('btnSpinner'),
          mediaInput: document.getElementById('mediaInput'),
          mediaPreview: document.getElementById('mediaPreview')
      };
      this.conditions = {
          new: 'Новое',
          excellent: 'Отличное',
          like_new: 'Хорошее',
          good: 'Удовлетворительное',
          satisfactory: 'Требуется ремонт'
      };
      this.mediaFiles = [];
      this.maxMediaCount = 5;

      this.init();
  }

  init() {
      if (!this.elements.form) return;

      this.setupTelegram();
      this.setupEventListeners();
      this.updatePreview();
      this.initMediaUpload();
  }

  initMediaUpload() {
      document.getElementById('addMediaBtn').addEventListener('click', () => {
          this.elements.mediaInput.click();
      });

      this.elements.mediaInput.addEventListener('change', async (e) => {
          const files = Array.from(e.target.files);
          if (files.length > this.maxMediaCount - this.mediaFiles.length) {
              this.showError(`Максимум ${this.maxMediaCount} файлов`);
              return;
          }

          for (const file of files) {
              if (!this.validateFile(file)) continue;
              
              const tempUrl = URL.createObjectURL(file);
              const mediaItem = {
                  file,
                  tempUrl,
                  type: file.type.startsWith('video') ? 'video' : 'image',
                  file_id: null
              };

              this.mediaFiles.push(mediaItem);
              this.renderMediaItem(mediaItem, this.mediaFiles.length - 1);
          }

          await this.uploadMediaFiles();
          this.updateFormState();
      });
  }

  validateFile(file) {
      const validTypes = ['image/jpeg', 'image/png', 'video/mp4'];
      const maxSize = 20 * 1024 * 1024;

      if (!validTypes.includes(file.type)) {
          this.showError('Неподдерживаемый формат файла');
          return false;
      }

      if (file.size > maxSize) {
          this.showError('Файл слишком большой (макс. 20MB)');
          return false;
      }

      return true;
  }

  async uploadMediaFiles() {
    try {
        const uploadPromises = this.mediaFiles
            .filter(m => !m.file_id)
            .map(async (media, index) => {
                try {
                    const formData = new FormData();
                    formData.append('file', media.file);
                    
                    const response = await fetch('https://api.your-service.com/upload', {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }

                    const result = await response.json();
                    
                    if (!result.fileId) {
                        throw new Error('Invalid server response');
                    }

                    media.file_id = result.fileId;
                    URL.revokeObjectURL(media.tempUrl);
                    this.updateMediaItem(index);

                } catch (error) {
                    console.error('Upload failed:', error);
                    this.showError(`Ошибка загрузки: ${media.file.name}`);
                    throw error;
                }
            });

        await Promise.all(uploadPromises);
    } catch (error) {
        this.showError('Не удалось загрузить файлы');
        console.error('Media upload error:', error);
    }
  }

  renderMediaItem(media, index) {
    const item = document.createElement('div');
    item.className = 'media-item';
    item.innerHTML = `
        ${media.type === 'video' ? `
            <video class="media-preview" src="${media.tempUrl}" controls></video>
        ` : `
            <img class="media-preview" src="${media.tempUrl}" alt="Превью">
        `}
        <div class="upload-status">
            ${media.file_id ? '' : `
                <div class="loading-spinner"></div>
                <span>Загрузка...</span>
            `}
        </div>
        <div class="remove-media" data-index="${index}">×</div>
    `;

    // Обработчик удаления
    item.querySelector('.remove-media').addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        this.mediaFiles.splice(idx, 1);
        this.elements.mediaPreview.removeChild(item);
        this.updateFormState();
    });

    this.elements.mediaPreview.appendChild(item);
  }

  updateFormState() {
      this.validateForm(this.getFormData());
      this.updatePreview();
  }

  setupTelegram() {
      if (!this.state.isTelegram) return;
      
      this.tg.ready();
      this.tg.expand();
      this.tg.MainButton.setParams({
          color: this.tg.themeParams.button_color || '#0088cc',
          text_color: '#ffffff',
          is_active: false,
          is_visible: false
      });
  }

  setupEventListeners() {
      const inputs = [
          'model', 'category', 'memory', 'price', 'discount',
          'original_price', 'condition', 'color', 'battery',
          'location', 'description'
      ];

      inputs.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.addEventListener('input', () => this.updatePreview());
      });

      ['delivery_possible', 'meetup_possible', 'publish_avito', 'publish_telegram'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.addEventListener('change', () => this.updatePreview());
      });

      if (this.elements.submitBtn) {
          this.elements.submitBtn.addEventListener('click', (e) => this.handleSubmit(e));
      }

      if (this.state.isTelegram) {
          this.tg.MainButton.onClick(() => this.handleSubmit());
      }
  }

  getFormData() {
      const getValue = id => document.getElementById(id)?.value.trim() || '';
      const getChecked = id => document.getElementById(id)?.checked || false;

      return {
          type: "add_products",
          model: getValue('model'),
          category: getValue('category'),
          memory: getValue('memory'),
          price: getValue('price'),
          discount: getValue('discount'),
          original_price: getValue('original_price'),
          condition: getValue('condition'),
          color: getValue('color'),
          battery: getValue('battery'),
          location: getValue('location'),
          delivery: getChecked('delivery_possible'),
          meetup: getChecked('meetup_possible'),
          publish_avito: getChecked('publish_avito'),
          publish_telegram: getChecked('publish_telegram'),
          description: getValue('description'),
          media: this.mediaFiles.map(m => ({
              file_id: m.file_id,
              type: m.type
          }))
      };
  }

  updatePreview() {
      if (!this.elements.preview) return;
      
      const formData = this.getFormData();
      this.elements.preview.innerHTML = this.renderPreview(formData);
      this.validateForm(formData);
  }

  renderPreview(data) {
      const finalPrice = data.discount && data.price 
          ? Math.round(data.price * (1 - (data.discount/100))) 
          : data.price;

      const conditionText = this.conditions[data.condition] || data.condition;

      return `
          <div class="preview-card">
              ${this.renderField('📱 Модель', `${data.model || 'Не указана'}${data.memory ? ` | ${data.memory}ГБ` : ''}`, true)}
              
              ${data.price ? this.renderField('💰 Цена', `
                  ${data.discount ? `<span class="old-price">${this.formatPrice(data.price)}</span>` : ''}
                  <span class="current-price">${this.formatPrice(finalPrice)}₽</span>
                  ${data.discount ? `<span class="discount-badge">-${data.discount}%</span>` : ''}
              `) : ''}
              
              ${data.condition ? this.renderField('⚡ Состояние', conditionText) : ''}
              ${data.color ? this.renderField('🎨 Цвет', data.color) : ''}
              ${data.battery ? this.renderField('🔋 Батарея', `${data.battery}%`) : ''}
              
              ${data.location ? `
                  ${this.renderField('📍 Локация', data.location)}
                  ${this.renderField('🚚 Доставка', `
                      <span class="delivery-option ${data.delivery ? 'active' : ''}">
                          ${data.delivery ? 'Вкл' : 'Выкл'}
                      </span>
                      <span class="delivery-options-separator">${data.meetup ? '+' : ''}</span>
                      ${data.meetup ? `
                          <span class="meetup-option ${data.meetup ? 'active' : ''}">
                              Самовывоз
                          </span>
                      ` : ''}
                  `)}
              ` : ''}
              
              ${data.description ? this.renderField('📝 Описание', this.truncateText(data.description)) : ''}
          </div>
      `;
  }

  renderField(label, value, isTitle = false) {
      if (!value) return '';
      return `
          <div class="preview-field ${isTitle ? 'title-field' : ''}">
              <span class="field-label">${label}:</span>
              <span class="field-value">${value}</span>
          </div>
      `;
  }

  validateForm(data) {
      const hasMedia = this.mediaFiles.length > 0;
      const allUploaded = this.mediaFiles.every(m => m.file_id);
      const requiredFields = ['model', 'category', 'price', 'location', 'original_price', 'condition'];
      this.state.isValid = requiredFields.every(field => data[field] && data[field].toString().trim() !== '') && hasMedia && allUploaded;

      if (this.elements.submitBtn) {
          this.elements.submitBtn.disabled = !this.state.isValid;
          this.elements.btnSpinner.style.display = 'none';
          this.elements.btnText.style.display = 'inline';
      }

      if (this.state.isTelegram) {
          if (this.state.isValid) {
              this.tg.MainButton.setText('🚀 Опубликовать');
              this.tg.MainButton.show().enable();
          } else {
              this.tg.MainButton.hide();
          }
      }
  }

  handleSubmit(e) {
      if (e) e.preventDefault();
      if (!this.state.isValid) return;

      this.showLoading(true);

      const formData = this.getFormData();
      const payload = JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString()
      });

      if (this.state.isTelegram) {
          this.tg.sendData(payload);
          setTimeout(() => this.tg.close(), 1000);
      } else {
          console.log('Данные формы:', formData);
          setTimeout(() => this.showLoading(false), 1500);
      }
  }

  showLoading(show) {
      if (this.elements.submitBtn) {
          this.elements.submitBtn.disabled = show;
          this.elements.btnText.style.display = show ? 'none' : 'inline';
          this.elements.btnSpinner.style.display = show ? 'inline-block' : 'none';
      }
  }

  formatPrice(price) {
      return price ? Number(price).toLocaleString('ru-RU') : '0';
  }

  truncateText(text, maxLength = 120) {
      return text && text.length > maxLength 
          ? text.substring(0, maxLength) + '...' 
          : text || '';
  }

  showError(message) {
      alert(message);
  }
}

document.addEventListener('DOMContentLoaded', () => new ProductForm());