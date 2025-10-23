import { Component, ElementRef, Inject, Input, OnInit, QueryList, ViewChildren } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { BillQr, ClientBill, LocalBill } from 'src/app/core/models/Lotery/bill';
import { BillService } from 'src/app/core/services/Lotery/bill.service';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Declaración de interfaces para Web Bluetooth
declare global {
  interface Navigator {
    bluetooth: {
      requestDevice(options?: {
        filters?: Array<{ name?: string; services?: string[] }>;
        optionalServices?: string[];
        acceptAllDevices?: boolean;
      }): Promise<BluetoothDevice>;
    };
  }
}

interface BluetoothDevice {
  gatt: {
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
  };
}

interface BluetoothRemoteGATTServer {
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
  disconnect(): void;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic {
  writeValue(data: BufferSource): Promise<void>;
}


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

  // generarQRData(index: number): string {
  //   // Concatenar tipoDocumentoIdentidad + nroDocumentoIdentidad
  //   const documento = `${this.cliente.tipoDocumentoIdentidad}${this.cliente.nroDocumentoIdentidad}`;
    
  //   // Crear ID único para cada cupón: local.id + numero + índice
  //   const cuponId = `${this.local.id}${this.numero}${index + 1}`;
    
  //   // agregar url de abajo al qr
  //   //https://platformsorteosstage..com.ve/ganador?clienteId=123&localId=456&billNumber=789

  //   // Datos para el QR (puedes modificar según lo que necesites codificar)
  //   const qrData = {
  //     cuponId: cuponId,
  //     cliente: this.cliente,
  //     fecha: this.fecha,
  //     monto: this.monto,
  //     local: this.local.nombre,
  //     cuponNumero: index + 1,
  //     totalCupones: this.cupones
  //   };

  //   return JSON.stringify(qrData);
  // }

  // Método para obtener el ID para mostrar en el template
  getCuponId(index: number): string {
    return `${this.local.id}${this.numero}${index + 1}`;
  }

  async onPrint() {
    Swal.fire({
      title: `¿Estás seguro que deseas imprimir?`,
      text: `Se imprimirán ${this.cupones} cupones`,
      showDenyButton: true,
      confirmButtonText: `Imprimir`,
      denyButtonText: 'Cancelar',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        try {
          await this.imprimirPDFConQR(); //PDF
          // Actualizar estado de impresión en el servidor
          this.billService.editPrint(this.id, 1).subscribe();
          return true;
        } catch (error) {
          Swal.showValidationMessage(`Error al generar PDF: ${error}`);
          console.log(`Error al generar PDF: ${error}`);
          await this.imprimirPDFConQR();
          return false;
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire('¡Éxito!', 'Cupones enviados a impresión', 'success');
      }
    });
  }

  private async pruebaRapida(): Promise<void> {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ name: 'FRM-5809' }],
      optionalServices: ['00001101-0000-1000-8000-00805f9b34fb']
    });

    const server = await device.gatt!.connect();
    const service = await server.getPrimaryService('00001101-0000-1000-8000-00805f9b34fb');
    const characteristic = await service.getCharacteristic('00001101-0000-1000-8000-00805f9b34fb');

    // Comandos simples de prueba
    const testData = new TextEncoder().encode('HOLA MUNDO\n\nTEST IMPRESORA\n\n\n');
    
    // Esto SIEMPRE funciona
    await characteristic.writeValue(testData.buffer);
    
    server.disconnect();
    console.log('Test enviado - revisa la impresora');

  } catch (error) {
    console.error('Error en prueba:', error);
  }
}

  private async imprimirDirectamenteBluetooth(): Promise<void> {
    try {
      console.log('=== INICIANDO CONEXIÓN BLUETOOTH ===');
      
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'FRM-5809' }],
        optionalServices: ['00001101-0000-1000-8000-00805f9b34fb'] // Servicio SPP
      });

      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService('00001101-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('00001101-0000-1000-8000-00805f9b34fb');

      const printData = this.generarComandosEscPosParaTodosCupones();
      
      // SOLUCIÓN: Usar el ArrayBuffer directamente
      await characteristic.writeValue(printData); // printData es ArrayBuffer
      
      server.disconnect();
      console.log('Impresión enviada');

    } catch (error) {
      console.error('Error:', error);
    }
  }

  // Método de delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


private generarComandosEscPosParaTodosCupones(): ArrayBuffer {
  const commands: number[] = [];
  
  // Inicializar impresora
  commands.push(0x1B, 0x40); // ESC @ - Inicializar
  
  // Generar cada cupón
  for (let i = 0; i < this.cuponesArray.length; i++) {
    if (i > 0) {
      commands.push(0x0A, 0x0A); // Dos líneas en blanco
    }
    
    // Encabezado centrado
    commands.push(0x1B, 0x61, 0x01); // Centrar
    const header = `CUPON ${i + 1}\n`;
    for (let j = 0; j < header.length; j++) {
      commands.push(header.charCodeAt(j));
    }
    
    // ID del cupón
    commands.push(0x1B, 0x61, 0x00); // Alinear izquierda
    const idText = `ID: ${this.local.id}${this.numero}${i + 1}\n`;
    for (let j = 0; j < idText.length; j++) {
      commands.push(idText.charCodeAt(j));
    }
    
    // QR Code
    commands.push(0x1B, 0x61, 0x01); // Centrar
    commands.push(...this.generarComandoQR(i));
    
    // Información del documento
    const docText = `${this.cliente.tipoDocumentoIdentidad}-${this.cliente.nroDocumentoIdentidad}\n`;
    for (let j = 0; j < docText.length; j++) {
      commands.push(docText.charCodeAt(j));
    }
  }
  
  // Cortar papel
  commands.push(0x1D, 0x56, 0x41, 0x10); // Cortar
  
  // Convertir a ArrayBuffer
  const buffer = new ArrayBuffer(commands.length);
  const view = new Uint8Array(buffer);
  view.set(commands);
  
  return buffer;
}

  // Método auxiliar para agregar texto
  private addTextToCommands(commands: number[], text: string): void {
    for (let i = 0; i < text.length; i++) {
      commands.push(text.charCodeAt(i));
    }
  }

  // QR Code simplificado (compatible con más impresoras)
  private addSimpleQRCode(commands: number[], index: number): void {
    const qrData = this.generarQRData(index);
    
    // Comandos QR básicos (compatibles con la mayoría de impresoras)
    commands.push(0x1B, 0x61, 0x01); // Center
    
    // Método alternativo para QR (más compatible)
    try {
      // Tamaño del QR
      commands.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x03);
      // Nivel de corrección
      commands.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31);
      // Almacenar datos
      const len = qrData.length + 3;
      commands.push(0x1D, 0x28, 0x6B, len % 256, Math.floor(len / 256), 0x31, 0x50, 0x30);
      // Datos
      this.addTextToCommands(commands, qrData);
      // Imprimir QR
      commands.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30);
    } catch (error) {
      console.warn('Error generando QR, usando texto alternativo');
      this.addTextToCommands(commands, `[QR: ${qrData}]\n\n`);
    }
    
    commands.push(0x0A, 0x0A); // Espacios después del QR
  }

private generarComandoQR(index: number): number[] {
  const commands: number[] = [];
  const qrData = this.generarQRData(index);
  
  console.log(`Generando QR para cupón ${index + 1}:`, qrData);
  
  // Comandos ESC/POS para QR Code
  // Establecer tamaño del módulo QR (tamaño 6)
  commands.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x06);
  
  // Establecer corrección de error (nivel L - 30%)
  commands.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x30);
  
  // Almacenar datos QR en la memoria de impresión
  const len = qrData.length + 3;
  const pL = len % 256;
  const pH = Math.floor(len / 256);
  
  commands.push(0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30);
  
  // Agregar datos QR
  for (let i = 0; i < qrData.length; i++) {
    commands.push(qrData.charCodeAt(i));
  }
  
  // Imprimir el símbolo QR
  commands.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30);
  
  return commands;
}

generarQRData(index: number): string {
  // Datos que irán en el QR - formato simple para evitar problemas
  return `ID:${this.local.id}${this.numero}${index + 1}|DOC:${this.cliente.tipoDocumentoIdentidad}-${this.cliente.nroDocumentoIdentidad}`;
}


  //Codigo a continuacion imprime PDF

  private async imprimirPDFConQR(): Promise<void> {
    // Esperar más tiempo para que los QR se rendericen completamente
    await new Promise(resolve => setTimeout(resolve, 1000));

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 150]
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
            clonedElement.style.border = '2px solid #000';
            
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
    // Crear blob del PDF
    const pdfBlob = pdf.output('blob');
    
    // Crear URL para el blob
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Crear iframe para impresión
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = pdfUrl;
    
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      try {
        // Intentar imprimir automáticamente
        iframe.contentWindow?.print();
        
        // Limpiar después de un tiempo
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(pdfUrl);
        }, 1000);
        
      } catch (error) {
        console.error('Error al imprimir:', error);
        
        // Fallback: Descargar PDF si la impresión automática falla
        pdf.save(`cupones-${this.numero}.pdf`);
        
        document.body.removeChild(iframe);
        URL.revokeObjectURL(pdfUrl);
        
        Swal.fire({
          icon: 'info',
          title: 'PDF Listo',
          text: 'El PDF se ha descargado. Por favor, imprímalo manualmente.',
          confirmButtonText: 'Aceptar'
        });
      }
    };
  }

  onEmail() {
    // Lógica para enviar el cupón por email
    console.log('Enviar cupón por email');
  }

  closeModal() {
    this.dialogRef.close();
  }

}
