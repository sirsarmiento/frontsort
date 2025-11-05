import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { UserService } from 'src/app/core/services/user.service';

export interface DialogData { id: number; urlPhoto: string }

@Component({
  selector: 'app-modal-generic',
  styleUrls: ['./modal-generic.component.scss'],
  templateUrl: './modal-generic.component.html'
})
export class ModalGenericComponent implements OnInit {
  urlPhoto: string;
  zoomLevel: number = 1;
  rotation: number = 0;

  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  fileError: string = '';
  isLoading: boolean = false;

  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('fileInputReplace') fileInputReplace!: ElementRef;

  constructor(
     public dialogRef: MatDialogRef<ModalGenericComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private toastrService: ToastrService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.urlPhoto = this.data.urlPhoto;
  }

  closeModal() {
    this.dialogRef.close();
  }

  zoomIn(): void {
    this.zoomLevel = Math.min(this.zoomLevel + 0.25, 3);
    this.applyTransform();
  }

  zoomOut(): void {
    this.zoomLevel = Math.max(this.zoomLevel - 0.25, 0.5);
    this.applyTransform();
  }

  rotateImage(): void {
    this.rotation = (this.rotation + 90) % 360;
    this.applyTransform();
  }

  private applyTransform(): void {
    const imgElement = document.querySelector('.modal-image') as HTMLElement;
    if (imgElement) {
      imgElement.style.transform = `scale(${this.zoomLevel}) rotate(${this.rotation}deg)`;
    }
  }

  onSave() {
    if (!this.selectedFile) {
      this.toastrService.warning('Por favor seleccione un archivo');
      return;
    }

    this.isLoading = true;

    this.userService.uploadCiPhoto(this.data.id, this.selectedFile).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.toastrService.success('Archivo subido exitosamente');
        this.dialogRef.close({ success: true, data: response });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al subir archivo:', error);
        this.toastrService.error('Error al subir el archivo');
      }
    });
  }

onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    
    if (file) {
      // Validaciones
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      
      if (file.size > maxSize) {
        this.toastrService.error('El archivo no debe exceder los 5MB');
        this.clearFileSelection();
        return;
      }
      
      if (!allowedTypes.includes(file.type)) {
        this.toastrService.error('Solo se permiten archivos JPG, PNG o PDF');
        this.clearFileSelection();
        return;
      }
      
      this.selectedFile = file;
      this.fileError = '';
      
      // Generar vista previa si es imagen
      if (this.isImageFile(file)) {
        this.generateImagePreview(file);
        // ACTUALIZAR urlPhoto PARA MOSTRAR LA IMAGEN PRINCIPAL
        const reader = new FileReader();
        reader.onload = () => {
          this.urlPhoto = reader.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        this.imagePreview = null;
        // Para PDF, podrías mostrar un placeholder o limpiar urlPhoto
        this.urlPhoto = null; // o un placeholder para PDF
      }
    }
  }

   // Método para generar vista previa de imágenes
  private generateImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result;
    };
    reader.readAsDataURL(file);
  }

  // Verificar si el archivo es una imagen
  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  // Eliminar archivo seleccionado
  removeFile(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.fileInput.nativeElement.value = '';
  }

  // Limpiar selección de archivo
  private clearFileSelection(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.fileInput.nativeElement.value = '';
  }

}
