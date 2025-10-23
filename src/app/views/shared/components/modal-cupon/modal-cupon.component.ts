import { Component, ElementRef, Inject, Input, OnInit, QueryList, ViewChildren } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { BillQr, ClientBill, LocalBill } from 'src/app/core/models/Lotery/bill';
import { BillService } from 'src/app/core/services/Lotery/bill.service';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface DialogData { bill: BillQr }


@Component({
  selector: 'app-modal-cupon',
  styleUrls: ['./modal-cupon.component.scss'],
  templateUrl: './modal-cupon.component.html'
})
export class ModalCuponComponent implements OnInit {
  @ViewChildren('cuponElement') cuponElements!: QueryList<ElementRef>;

  selectedRow;
  displayedColumns: string[] = ['fullName','dependence','position'];
  dataSource: MatTableDataSource<any>;
  documento: string
  
  constructor(
     private billService: BillService,
     public dialogRef: MatDialogRef<ModalCuponComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}





  //@Input() data: any;

  // Propiedades separadas para facilitar el acceso en el template
  id: number = 0;
  numero: string = '';
  fecha: string = '';
  hora: string = '';
  monto: number = 0;
  montoMin: number = 0;
  tasa: number = 0;
  print: number = 0;
  cupones: number = 0;
  cliente: ClientBill = {} as ClientBill;
  local: LocalBill = {} as LocalBill;
  cuponesArray: number[] = [];

  ngOnInit() {
    this.initializeData();
  }

  initializeData() {
    if (this.data) {
      this.id = this.data.bill.id;
      this.numero = this.data.bill.numero;
      this.fecha = this.data.bill.fecha.toString();
      this.hora = this.data.bill.hora;
      this.monto = this.data.bill.monto;
      this.montoMin = this.data.bill.montoMin;
      this.tasa = this.data.bill.tasa;
      this.print = this.data.bill.print;
      this.cupones = this.getCupones(this.data.bill);
      this.cliente = this.data.bill.cliente;
      this.local = this.data.bill.local;
      // Crear array para el *ngFor
      this.cuponesArray = Array(this.cupones).fill(0).map((x, i) => i);
    }
  }

  getCupones(row: BillQr){
    return Math.trunc(row.monto / row.montoMin);
  }

  generarQRData(index: number): string {
     this.documento = `${this.cliente.tipoDocumentoIdentidad}${this.cliente.nroDocumentoIdentidad}`;
    
    // agregar url de abajo al qr
    //https://platformsorteosstage..com.ve/ganador?clienteId=123&localId=456&billNumber=789

    // Datos para el QR (puedes modificar según lo que necesites codificar)
    const qrData = `GANADOR

      CLIENTE
      Cedula: ${this.cliente.nroDocumentoIdentidad}
      Nombre: ${this.cliente.nombreCompleto}
      Telefono: ${this.cliente.telefono || 'No registrado'}

      LOCAL
      Nombre: ${this.local.nombre}

      FACTURA
      Numero: ${this.numero}
      Fecha: ${this.formatearFecha(this.fecha)}`;

    return qrData;
  }

  
  formatearFecha(fecha): string {
        const fechaObj = new Date(fecha);
        
        return new Intl.DateTimeFormat('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(fechaObj);
    }

  // Método para obtener el ID para mostrar en el template
  getCuponId(index: number): string {
    return `${this.local.id}${this.numero}${index + 1}`;
  }

  async onPrint() {
    const result = await Swal.fire({
      title: `¿Estás seguro que deseas imprimir?`,
      text: `Se imprimirán ${this.cupones} cupones`,
      showDenyButton: true,
      confirmButtonText: `Imprimir`,
      denyButtonText: 'Cancelar',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        try {
          await this.imprimirPDFConQR();
          await this.billService.editPrint(this.id, 1).toPromise();
          return true;
        } catch (error) {
          Swal.showValidationMessage(`Error al generar PDF: ${error}`);
          return false;
        }
      }
    });

    if (result.isConfirmed) {
      Swal.fire('¡Éxito!', 'Cupones enviados a impresión', 'success');
    }
  }


  private async imprimirPDFConQR(): Promise<void> {
    // Esperar más tiempo para que los QR se rendericen completamente
    await new Promise(resolve => setTimeout(resolve, 1000));

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 100]
    });

    const cuponElementsArray = this.cuponElements.toArray();
    
    for (let i = 0; i < cuponElementsArray.length; i++) {
      const cuponElement = cuponElementsArray[i].nativeElement;
      
      try {
        // Forzar reflow y esperar a que el QR se renderice
        await this.esperarQRRenderizado(cuponElement);

        const canvas = await html2canvas(cuponElement, {
          scale: 3, // Aumentar escala para mejor calidad
          useCORS: true,
          logging: true, // Activar logging para debug
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: cuponElement.scrollWidth,
          height: cuponElement.scrollHeight,
          onclone: (clonedDoc, element) => {
            console.log('Clonando elemento:', element);
            // Aplicar estilos directamente al elemento clonado
            const clonedElement = element as HTMLElement;
            clonedElement.style.width = '280px';
            clonedElement.style.height = 'auto';
            clonedElement.style.padding = '15px';
            clonedElement.style.margin = '0 auto';
            clonedElement.style.backgroundColor = '#ffffff';
            
            // Asegurar que las imágenes se carguen
            const images = clonedElement.getElementsByTagName('img');
            for (let img of Array.from(images)) {
              img.style.display = 'block';
              img.style.margin = '0 auto';
            }
          }
        });

        console.log('Canvas generado:', canvas.width, 'x', canvas.height);

        if (canvas.width === 0 || canvas.height === 0) {
          throw new Error('Canvas vacío');
        }

        const imgData = canvas.toDataURL('image/png', 1.0); // Usar PNG para mejor calidad
        
        if (i > 0) {
          pdf.addPage();
        }

        const imgWidth = 70;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const xPosition = (80 - imgWidth) / 2;
        const yPosition = 5;
        
        pdf.addImage(imgData, 'PNG', xPosition, yPosition, imgWidth, imgHeight);

      } catch (error) {
        console.error('Error detallado:', error);
        throw new Error(`No se pudo generar el cupón ${i + 1}: ${error}`);
      }
    }

    this.imprimirPDF(pdf);
  }

  // Método para esperar a que los QR se rendericen
  private async esperarQRRenderizado(element: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      const qrImages = element.querySelectorAll('img');
      let imagesLoaded = 0;
      
      if (qrImages.length === 0) {
        // Si no hay imágenes, esperar un tiempo igual
        setTimeout(resolve, 500);
        return;
      }

      qrImages.forEach(img => {
        if (img.complete) {
          imagesLoaded++;
        } else {
          img.onload = () => {
            imagesLoaded++;
            if (imagesLoaded === qrImages.length) {
              resolve();
            }
          };
          img.onerror = () => {
            imagesLoaded++;
            if (imagesLoaded === qrImages.length) {
              resolve();
            }
          };
        }
      });

      // Timeout de seguridad
      if (imagesLoaded === qrImages.length) {
        resolve();
      } else {
        setTimeout(resolve, 1000);
      }
    });
  }

  imprimirPDF(pdf: jsPDF): void {
    pdf.save(`cupones-${this.documento}.pdf`);
    // // Crear blob del PDF
    // const pdfBlob = pdf.output('blob');
    
    // // Crear URL para el blob
    // const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // // Crear iframe para impresión
    // const iframe = document.createElement('iframe');
    // iframe.style.display = 'none';
    // iframe.src = pdfUrl;
    
    // document.body.appendChild(iframe);
    
    // iframe.onload = () => {
    //   try {
    //     // Intentar imprimir automáticamente
    //     iframe.contentWindow?.print();
        
    //     // Limpiar solo cuando se complete la impresión o se cancele
    //     iframe.contentWindow?.addEventListener('afterprint', () => {
    //       // Esperar un poco más antes de limpiar
    //       setTimeout(() => {
    //         document.body.removeChild(iframe);
    //         URL.revokeObjectURL(pdfUrl);
    //       }, 500);
    //     });
        
    //     // Timeout de seguridad por si el evento afterprint no se dispara
    //     setTimeout(() => {
    //       if (document.body.contains(iframe)) {
    //         document.body.removeChild(iframe);
    //         URL.revokeObjectURL(pdfUrl);
    //       }
    //     }, 30000); // 30 segundos como timeout de seguridad
        
    //   } catch (error) {
    //     console.error('Error al imprimir:', error);
        
    //     // Fallback: Descargar PDF si la impresión automática falla
    //     this.descargarPDF(pdf);
        
    //     document.body.removeChild(iframe);
    //     URL.revokeObjectURL(pdfUrl);
        
    //     Swal.fire({
    //       icon: 'info',
    //       title: 'PDF Listo',
    //       text: 'El PDF se ha descargado. Por favor, imprímalo manualmente.',
    //       confirmButtonText: 'Aceptar'
    //     });
    //   }
    // };
  }

  // Método alternativo para descargar el PDF
  private descargarPDF(pdf: jsPDF): void {
    pdf.save(`cupones-${this.numero}.pdf`);
  }

  onEmail() {
    // Lógica para enviar el cupón por email
    console.log('Enviar cupón por email');
  }

  closeModal() {
    this.dialogRef.close();
  }

}
