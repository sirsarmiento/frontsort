import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DialogData { urlPhoto: string }

@Component({
  selector: 'app-modal-generic',
  styleUrls: ['./modal-generic.component.scss'],
  templateUrl: './modal-generic.component.html'
})
export class ModalGenericComponent implements OnInit {
  urlPhoto: string;
  zoomLevel: number = 1;
  rotation: number = 0;
  constructor(
     public dialogRef: MatDialogRef<ModalGenericComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
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

}
