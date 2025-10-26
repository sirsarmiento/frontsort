import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/core/services/auth.service';
import { BillService } from 'src/app/core/services/Lotery/bill.service';

export interface DialogData { 
  id: number;
  // Puedes agregar más propiedades si necesitas
}

@Component({
  selector: 'app-modal-image-bill',
  styleUrls: ['./modal-image-bill.component.scss'],
  templateUrl: './modal-image-bill.component.html'
})
export class ModalImageBillComponent implements OnInit {
  userRoles: any[] = [];
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  fileError: string = '';
  isLoading: boolean = false;

  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(
    private billService: BillService,
    private toastrService: ToastrService,
    public dialogRef: MatDialogRef<ModalImageBillComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private authService: AuthService
  ) {
    const currentUser = this.authService.currentUser;
    this.userRoles = currentUser.roles;
  }

  ngOnInit() {
    // Puedes inicializar datos adicionales aquí si es necesario
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
      } else {
        this.imagePreview = null;
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

  onSave() {
    if (!this.selectedFile) {
      this.toastrService.warning('Por favor seleccione un archivo');
      return;
    }

    this.isLoading = true;

    this.billService.uploadBillPhoto(this.data.id, this.selectedFile).subscribe({
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

  closeModal() {
    this.dialogRef.close();
  }
}
