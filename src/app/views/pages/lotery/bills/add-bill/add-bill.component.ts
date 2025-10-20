import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { Bill } from 'src/app/core/models/Lotery/bill';
import { BillService } from 'src/app/core/services/Lotery/bill.service';
import { CommonsService } from 'src/app/core/services/commons.service';
import { SelectOption } from 'src/app/core/models/select-option';
import { ToastrService } from 'ngx-toastr';
import { TasaService } from 'src/app/core/services/Lotery/tasa.service';
import { LocalService } from 'src/app/core/services/Lotery/local.service';
import { Local } from 'src/app/core/models/Lotery/local';
import { UserService } from 'src/app/core/services/user.service';
import { Tasa } from 'src/app/core/models/Lotery/tasa';

@Component({
  selector: 'app-add-bill',
  templateUrl: './add-bill.component.html'
})
export class AddBillComponent implements OnInit {
  private userSubscription: Subscription;
  private data$: Observable<Bill>;
  form: FormGroup;
  id: number;
  tasa: number = 0;
  montoMin: number = 0;
  cliente: 0;
  loading = false;
  submitted = false;
  unamePattern = "^[a-zA-Z ]{3,30}$"; //Validate only caracters
  uidPattern = "^[VE][0-9]{7,9}$"; //Validate only VE and numbers

  minFecha = new Date(1950, 0, 1);
  maxFecha = new Date();

  estados:Array<SelectOption>;
  ciudades:Array<SelectOption>;

  locales: Local[] = [];
  tasas: Tasa[] = [];

  localId: number;

// Nuevas propiedades para la cámara
  showCameraDialog = false;
  isCameraAvailable = false;
  isCameraReady = false;
  hasMultipleCameras = false;
  capturedImage: File | null = null;
  capturedImagePreview: string | null = null;
  imagePreview: string | null = null;
  
  // Referencias a elementos del DOM
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  // Stream de la cámara
  private mediaStream: MediaStream | null = null;
  private availableCameras: MediaDeviceInfo[] = [];
  private currentCameraIndex = 0;
  fileError: string = '';

  constructor(
    private billService: BillService,
    private clientService: UserService,
    private commonsService: CommonsService,
    private formBuilder: FormBuilder,
    private router: Router,
    private toastrService: ToastrService,
    private tasaService: TasaService,
    private localService: LocalService,
  ) {
      this.myFormValues();
      this.data$ = billService.sharing;
   }

  get f() { return this.form.controls; }

  async ngOnInit() {
    this.f.fecha.setValue(this.maxFecha);

    this.setValues();
    this.getLastTasa();
    this.getLocales();
      const objetoJSON = localStorage.getItem('cusr');
      if (objetoJSON) {
        const localStore = JSON.parse(objetoJSON);
        this.estados = await this.commonsService.getAllEstados(localStore.user.country.value);
    }
  }

  getLastTasa(){
    this.tasaService.getAll().subscribe((resp: Tasa[]) => {
       this.tasas = resp;
    });
  }

  getLocales(){
    this.localService.getAll().subscribe((resp: any) => {
      this.locales = resp.data;
    });
  }

  getLocal(id: number) {
    this.localId = id;

    const fechaFormateada = this.formatDate(this.f.fecha.value);
    
    this.tasa = this.obtenerMontoPorFecha(fechaFormateada);
    
    this.getMontoMin(this.localId);

    if (this.tasa == null) this.toastrService.info('No existe tasa para la fecha seleccionada.');

  }


  getMontoMin(id: number) {
    const local = this.locales.find(l => l.id === id);

    if (local) {
      this.montoMin = local.monto * this.tasa;
    }
  }

  onFechaChange(event: any): void {
    const fechaSeleccionada = event.value; // ¡Importante! Usar event.value, no event.target.value
    
    // Formatear la fecha si es necesario (dependiendo de cómo estén almacenadas en tus tasas)
    const fechaFormateada = this.formatDate(fechaSeleccionada);
    
    this.tasa = this.obtenerMontoPorFecha(fechaFormateada);

    if (this.tasa == null) this.toastrService.info('No existe tasa para la fecha seleccionada.');
    
    this.getMontoMin(this.localId);

  }

  // Función para formatear la fecha a YYYY-MM-DD
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  obtenerMontoPorFecha(fecha: string): number | null {
    const tasaEncontrada = this.tasas['data'].find(tasa => tasa.fecha === fecha);
    return tasaEncontrada ? tasaEncontrada.monto : null;
  }
      
  back() {
    this.router.navigate(['/bills']);
    this.billService.resetData();
  }

  async searchClient() {
    if(this.f.nroDocumentoIdentidad.value != ''){
      const resp = await this.clientService.getUserByCi(this.f.nroDocumentoIdentidad.value);

      if (resp) {
        this.cliente = resp[0].id;
        this.f.tipoDocumentoIdentidad.setValue(resp[0].tipoDocumentoIdentidad);
        this.f.email.setValue(resp[0].email);
        this.f.primerNombre.setValue(resp[0].primerNombre);
        this.f.segundoNombre.setValue(resp[0].segundoNombre);
        this.f.primerApellido.setValue(resp[0].primerApellido);
        this.f.segundoApellido.setValue(resp[0].segundoApellido);
        this.f.estado.setValue(resp[0].estado.id);
        this.getCiudades(resp[0].estado.id);
        this.f.ciudad.setValue(resp[0].ciudad.id);
        this.f.direccion.setValue(resp[0].direccion);

        // Dividir el número de teléfono
        const numeroCompleto = resp[0].telefonos[0].numero; // "04142781730"

        // Primeros 4 dígitos para código
        this.f.codTelefono.setValue(numeroCompleto.substring(0, 4));
        
        // Resto del número (desde la posición 4 hasta el final)
        this.f.nroTelefono.setValue(numeroCompleto.substring(4));
      }
    }
  }

  setValues(){
    this.userSubscription = this.data$.subscribe( data => {

      if(data != null && data.id > 0){

        this.f.nroFactura.setValue(data.numero);
        this.f.fecha.setValue(data.fecha);
        this.f.hora.setValue(data.hora);
        this.f.monto.setValue(data.monto);
        this.montoMin = data.montoMin;
        this.f.local.setValue(data.local['id']);

        this.f.nroDocumentoIdentidad.setValue(data.cliente['nroDocumentoIdentidad']);

        this.searchClient();

        this.id = data.id;
      }
    });
  }

  async getCiudades(estadoId:any){
    this.ciudades = [];
    this.ciudades = await this.commonsService.getAllCiudades(estadoId);
  }

  setUserName(){
    this.form.patchValue({username: this.f.email.value});
  }

  myFormValues() {
    this.form = this.formBuilder.group({
      tipoDocumentoIdentidad: ['',Validators.required],
      nroDocumentoIdentidad: ['',Validators.required],
      email: ['',Validators.required],
      primerNombre: ['',Validators.required],
      segundoNombre: [''],
      primerApellido: ['',Validators.required],
      segundoApellido: [''],
      estado: ['',Validators.required],
      ciudad: ['',Validators.required],
      direccion: ['',Validators.required],
      codTelefono: ['',Validators.required],
      nroTelefono: ['',Validators.required],
      nroFactura: ['',Validators.required],
      fecha: ['',Validators.required],
      hora: ['',Validators.required],
      local: ['',Validators.required],
      monto: ['',Validators.required],
    }, { 
      validators: this.validarFechaHora.bind(this) 
    })
  }

  onSubmit() {

    // Validar que se haya capturado una imagen
    if (!this.capturedImage) {
      this.fileError = 'Debe capturar una foto de la factura';
      return;
    }


     if(this.tasa == null) {
      this.toastrService.info('', 'No existe tasa para la fecha de la factura seleccionada, por favor crearla.');
      return;
    }

    if(this.montoMin == 0) {
      this.toastrService.info('', 'El monto mínimo no puede ser 0, valide el monto de la tasa.');
      return;
    }

    if(this.montoMin > this.f.monto.value) {
      this.toastrService.info('', 'El monto debe ser mayor o igual al monto mínimo.');
      return;
    }

    this.submitted = true;

    if (this.form.invalid) { return; }

    this.loading = true;

    const cliente: any = {
      id: this.id,
      idStatus: 1,
      numeroDocumento: this.f.nroDocumentoIdentidad.value,
      tipoDocumentoIdentidad: this.f.tipoDocumentoIdentidad.value,
      primerNombre: this.f.primerNombre.value,
      segundoNombre: this.f.segundoNombre.value,
      primerApellido: this.f.primerApellido.value,
      segundoApellido: this.f.segundoApellido.value,
      fechaNacimiento: '2000-01-01',
      direccion: this.f.direccion.value,
      sexo: 'M',
      email: this.f.email.value,
      username: this.f.email.value,
      idCargo: 1,
      roles: [ 
        {
          rol: 'CLIENTE'
        }
      ],
      pais: 1,
      estado: this.f.estado.value,
      ciudad: this.f.ciudad.value,
      idempresa: null,
      telefono: [
        { 
          numero: this.f.codTelefono.value + this.f.nroTelefono.value 
        },
      ],
    }

    const factura: Bill = {
      numero: this.f.nroFactura.value,
      fecha: this.f.fecha.value,
      hora: this.f.hora.value,
      monto: this.f.monto.value,
      montoMin: Number(this.montoMin.toFixed(2)),
      tasa: this.tasa,
      local: this.f.local.value,
      user: this.cliente,
      print: 0,
      tickets: this.getCupones(this.f.monto.value, this.montoMin.toFixed(2))
    }

    console.log(cliente);
    console.log(factura);
     if(this.id == 0 || this.id == undefined){
      if(this.cliente == 0 || this.cliente == undefined){
        //Si el cliente no existe guardamos cliente, capturamos el id y guardamos facturas
        this.clientService.add(cliente).subscribe({
          next: ((resp) => {
            this.toastrService.success('Cliente registrado con éxito.');
            this.cliente = resp['id'];
            factura.user = this.cliente;
          }),
          error: () => {
            this.loading = false;
          },
          complete: () => {
            this.billService.add(factura).subscribe({
              next: ((resp) => {
                console.log(resp);
                this.toastrService.success('Factura registrada con éxito.');
              }),
              error: () => {
                this.loading = false;
              },
              complete: () => this.router.navigate(['/bills'])
            })
          }
        });
      }else{
        // Si el cliente existe tomamos el id del cliente y solo guardamos la factura

        this.billService.add(factura).subscribe({
          next: ((resp) => {
            this.toastrService.success('Factura registrada con éxito.');
            this.billService.uploadBillPhoto(resp['id'], this.capturedImage).subscribe(
              ({
                error: () => {
                  this.loading = false;
                },
                complete: () => this.toastrService.success('Imagen Factura registrada con éxito.')
              })
            )
          }),
          error: () => {
            this.loading = false;
          },
          complete: () => this.router.navigate(['/bills'])
        })
      }
    }else{
      this.billService.update(this.id, factura);
    }
  }

  getCupones(monto, montoMin){
    return Math.trunc(monto / montoMin);
  }

  validarFechaHora(formGroup: AbstractControl): ValidationErrors | null {
    const form = formGroup as FormGroup;
    const fechaControl = form.get('fecha');
    const horaControl = form.get('hora');

    // Limpiar errores previos
    if (horaControl?.errors) {
      if (horaControl.errors['fechaNoSeleccionada'] && fechaControl?.value) {
        delete horaControl.errors['fechaNoSeleccionada'];
        if (Object.keys(horaControl.errors).length === 0) {
          horaControl.setErrors(null);
        }
      }
    }

    if (!horaControl || !horaControl.value) {
      return null;
    }

    // Validar formato de hora
    const [horas, minutos] = horaControl.value.split(':').map(Number);
    if (isNaN(horas) || isNaN(minutos) || horas < 0 || horas > 23 || minutos < 0 || minutos > 59) {
      horaControl.setErrors({ ...horaControl.errors, formatoInvalido: true });
      return { formatoInvalido: true };
    }

    // Validar que exista fecha
    if (!fechaControl || !fechaControl.value) {
      horaControl.setErrors({ ...horaControl.errors, fechaNoSeleccionada: true });
      return { fechaNoSeleccionada: true };
    }

    // Validar hora futura solo si la fecha es hoy
    const fechaSeleccionada = new Date(fechaControl.value);
    const ahora = new Date();
    
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const fechaIngresada = new Date(
      fechaSeleccionada.getFullYear(), 
      fechaSeleccionada.getMonth(), 
      fechaSeleccionada.getDate()
    );

    if (fechaIngresada.getTime() === hoy.getTime()) {
      const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
      const minutosIngresados = horas * 60 + minutos;
      
      if (minutosIngresados > minutosActuales) {
        horaControl.setErrors({ ...horaControl.errors, horaFutura: true });
        return { horaFutura: true };
      } else {
        // Limpiar error de hora futura si ya no aplica
        if (horaControl.errors?.['horaFutura']) {
          delete horaControl.errors['horaFutura'];
          if (Object.keys(horaControl.errors).length === 0) {
            horaControl.setErrors(null);
          }
        }
      }
    }

    return null;
  }

  getHoraErrorMessage(): string {
    const errors = this.form.get('hora')?.errors;
    
    if (errors?.['required']) {
      return 'La hora es requerida';
    } else if (errors?.['formatoInvalido']) {
      return 'Formato de hora inválido';
    } else if (errors?.['horaFutura']) {
      return 'La hora no puede ser mayor a la hora actual';
    }
    
    return '';
  }

  // Método para abrir el diálogo de la cámara
  async openCameraDialog(): Promise<void> {
    this.showCameraDialog = true;
    this.fileError = '';
    
    // Inicializar la cámara después de que el diálogo se muestre
    setTimeout(() => {
      this.initializeCamera();
    }, 100);
  }

  // Método para cerrar el diálogo de la cámara
  closeCameraDialog(): void {
    this.stopCamera();
    this.showCameraDialog = false;
    this.capturedImagePreview = null;
  }

    // Inicializar la cámara
  async initializeCamera(): Promise<void> {
    try {
      // Verificar si el navegador soporta mediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.fileError = 'Tu navegador no soporta el acceso a la cámara';
        this.isCameraAvailable = false;
        return;
      }

      // Primero obtener los dispositivos disponibles
      await this.getAvailableCameras();
      
      // Si no hay cámaras disponibles
      if (this.availableCameras.length === 0) {
        this.fileError = 'No se encontraron cámaras disponibles en el dispositivo';
        this.isCameraAvailable = false;
        return;
      }

      // Iniciar la cámara
      await this.startCamera();
      
      this.isCameraAvailable = true;
      this.fileError = '';

    } catch (error: any) {
      console.error('Error al inicializar la cámara:', error);
      this.isCameraAvailable = false;
      
      // Mensajes de error más específicos
      if (error.name === 'NotAllowedError') {
        this.fileError = 'Permiso de cámara denegado. Por favor, permite el acceso a la cámara en la configuración de tu navegador.';
      } else if (error.name === 'NotFoundError') {
        this.fileError = 'No se encontró ninguna cámara disponible en el dispositivo.';
      } else if (error.name === 'NotSupportedError') {
        this.fileError = 'Tu navegador no soporta el acceso a la cámara.';
      } else if (error.name === 'NotReadableError') {
        this.fileError = 'La cámara está siendo usada por otra aplicación. Cierra otras aplicaciones que puedan estar usando la cámara.';
      } else {
        this.fileError = 'Error al acceder a la cámara. Verifica los permisos y que la cámara esté conectada.';
      }
    }
  }

  // Obtener cámaras disponibles
  async getAvailableCameras(): Promise<void> {
    try {
      console.log('Solicitando permisos de cámara...');
      
      // Primero obtener un stream temporal para tener permisos
      const tempStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Detener el stream temporal inmediatamente
      tempStream.getTracks().forEach(track => {
        track.stop();
      });

      // Esperar un momento para que los dispositivos estén disponibles
      await new Promise(resolve => setTimeout(resolve, 500));

      // Enumerar dispositivos
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('Dispositivos encontrados:', devices);
      
      this.availableCameras = devices.filter(device => 
        device.kind === 'videoinput' && device.deviceId !== ''
      );
      
      this.hasMultipleCameras = this.availableCameras.length > 1;
      
      console.log(`Cámaras disponibles: ${this.availableCameras.length}`);
      
      if (this.availableCameras.length === 0) {
        console.warn('No se encontraron cámaras disponibles');
      }
      
    } catch (error: any) {
      console.error('Error al obtener cámaras:', error);
      this.availableCameras = [];
      this.hasMultipleCameras = false;
      
      // Si falla el permiso, intentar sin el stream temporal
      if (error.name === 'NotAllowedError') {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          this.availableCameras = devices.filter(device => 
            device.kind === 'videoinput' && device.deviceId !== ''
          );
          this.hasMultipleCameras = this.availableCameras.length > 1;
        } catch (secondError) {
          console.error('Error secundario al enumerar dispositivos:', secondError);
        }
      }
    }
  }

  // Iniciar la cámara
  async startCamera(): Promise<void> {
    try {
      // Detener cámara anterior si existe
      this.stopCamera();

      let constraints: MediaStreamConstraints;

      // Intentar diferentes configuraciones en orden de preferencia
      const configuraciones = [
        // Configuración 1: Cámara específica si está disponible
        () => {
          if (this.availableCameras.length > 0) {
            return {
              video: {
                deviceId: { exact: this.availableCameras[this.currentCameraIndex].deviceId },
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }
            };
          }
          return null;
        },
        // Configuración 2: Cámara trasera
        () => ({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        }),
        // Configuración 3: Cualquier cámara
        () => ({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        }),
        // Configuración 4: Mínimos requisitos
        () => ({
          video: true
        })
      ];

      let lastError: any;

      for (const config of configuraciones) {
        const configResult = config();
        if (configResult === null) continue; // Saltar configuración no aplicable

        try {
          console.log('Intentando configuración:', configResult);
          this.mediaStream = await navigator.mediaDevices.getUserMedia(configResult);
          
          if (this.videoElement && this.mediaStream) {
            this.videoElement.nativeElement.srcObject = this.mediaStream;
            this.isCameraReady = true;
            console.log('Cámara iniciada exitosamente');
            return; // Éxito, salir del método
          }
        } catch (error) {
          console.log('Configuración fallida:', configResult, error);
          lastError = error;
          continue; // Intentar siguiente configuración
        }
      }

      // Si todas las configuraciones fallaron
      throw lastError || new Error('No se pudo iniciar ninguna cámara');

    } catch (error: any) {
      console.error('Error al iniciar cámara después de todos los intentos:', error);
      throw error;
    }
  }

  // Detener la cámara
  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.isCameraReady = false;
  }

  // Cambiar entre cámaras
  async switchCamera(): Promise<void> {
    if (this.availableCameras.length <= 1) return;

    this.currentCameraIndex = (this.currentCameraIndex + 1) % this.availableCameras.length;
    await this.startCamera();
  }

  // Capturar imagen
  captureImage(): void {
    if (!this.isCameraReady || !this.videoElement || !this.canvasElement) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Configurar canvas con las dimensiones del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir a Data URL para vista previa
    this.capturedImagePreview = canvas.toDataURL('image/jpeg', 0.8);
  }

  // Aceptar la captura
  acceptCapture(): void {
    if (!this.capturedImagePreview) return;

    // Convertir Data URL a File
    this.dataURLtoFile(this.capturedImagePreview, 'factura_capturada.jpg')
      .then(file => {
        // Validar tamaño
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          this.fileError = 'La imagen capturada es demasiado grande';
          return;
        }

        this.capturedImage = file;
        this.imagePreview = this.capturedImagePreview;
        this.closeCameraDialog();
        this.fileError = '';
      })
      .catch(error => {
        console.error('Error al procesar imagen:', error);
        this.fileError = 'Error al procesar la imagen capturada';
      });
  }

  // Reintentar captura
  retryCapture(): void {
    this.capturedImagePreview = null;
  }

  // Convertir Data URL a File
  private dataURLtoFile(dataURL: string, filename: string): Promise<File> {
    return new Promise((resolve, reject) => {
      try {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)![1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        
        const file = new File([u8arr], filename, { type: mime });
        resolve(file);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Eliminar imagen capturada
  removeCapturedImage(): void {
    this.capturedImage = null;
    this.imagePreview = null;
    this.capturedImagePreview = null;
  }

  // Limpiar recursos cuando el componente se destruya
  ngOnDestroy(): void {
    this.stopCamera();
  }


  // // Método para manejar la selección de archivos
  // onFileSelected(event: any): void {
  //   const file: File = event.target.files[0];
    
  //   if (file) {
  //     // Validaciones
  //     const maxSize = 5 * 1024 * 1024; // 5MB
  //     const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      
  //     if (file.size > maxSize) {
  //       this.fileError = 'El archivo no debe exceder los 5MB';
  //       this.clearFileSelection();
  //       return;
  //     }
      
  //     if (!allowedTypes.includes(file.type)) {
  //       this.fileError = 'Solo se permiten archivos JPG, PNG o PDF';
  //       this.clearFileSelection();
  //       return;
  //     }
      
  //     this.selectedFile = file;
  //     this.fileError = '';
      
  //     // Generar vista previa si es imagen
  //     if (this.isImageFile(file)) {
  //       this.generateImagePreview(file);
  //     }
  //   }
  // }

  // // Método para generar vista previa de imágenes
  // private generateImagePreview(file: File): void {
  //   const reader = new FileReader();
  //   reader.onload = () => {
  //     this.imagePreview = reader.result;
  //   };
  //   reader.readAsDataURL(file);
  // }

  // // Verificar si el archivo es una imagen
  // isImageFile(file: File): boolean {
  //   return file.type.startsWith('image/');
  // }

  // // Eliminar archivo seleccionado
  // removeFile(): void {
  //   this.selectedFile = null;
  //   this.imagePreview = null;
  //   this.fileInput.nativeElement.value = '';
  // }

  // // Limpiar selección de archivo
  // private clearFileSelection(): void {
  //   this.selectedFile = null;
  //   this.imagePreview = null;
  //   this.fileInput.nativeElement.value = '';
  // }

}
