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
  templateUrl: './add-bill.component.html',
  styleUrls: ['./add-bill.component.scss']
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
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;

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

  ngAfterViewInit() {
    console.log('🔍 VideoElement en ngAfterViewInit:', this.videoElement);
    if (this.videoElement?.nativeElement) {
      console.log('✅ Native element encontrado:', this.videoElement.nativeElement);
      console.log('📺 Tag:', this.videoElement.nativeElement.tagName);
    } else {
      console.error('❌ VideoElement NO disponible en ngAfterViewInit');
      // Mostrar ayuda para debug
      this.debugVideoElement();
    }
  }

  private debugVideoElement() {
    // Verificar si el elemento existe en el DOM
    const videoElements = document.getElementsByTagName('video');
    console.log('🎥 Videos en DOM:', videoElements.length);
    
    for (let i = 0; i < videoElements.length; i++) {
      console.log(`Video ${i}:`, videoElements[i]);
    }
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

  async initializeCamera() {
    try {
      console.log('🔄 Inicializando cámara...');
      await this.startCamera();
    } catch (error) {
      console.error('❌ Error al inicializar cámara:', error);
      // Mostrar mensaje al usuario
      this.showCameraError();
    }
  }

  
  private showCameraError() {
    // Aquí puedes mostrar un mensaje en la UI al usuario
    console.error('No se pudo acceder a la cámara. Verifica los permisos.');
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

async startCamera(): Promise<void> {
  try {
    this.stopCamera();

    // 1. Asegurar que el elemento video esté disponible
    await this.ensureVideoElementReady();

    // 2. Verificar mediaDevices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('El navegador no soporta acceso a la cámara');
    }

    const video = this.videoElement.nativeElement;
    let lastError: any;

    const configuraciones = [
      // Configuración 1: Cámara específica
      () => {
        if (this.availableCameras.length > 0) {
          return {
            video: {
              deviceId: { exact: this.availableCameras[this.currentCameraIndex].deviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 }
            },
            audio: false
          };
        }
        return null;
      },
      // Configuración 2: Cámara trasera
      () => ({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false
      }),
      // Configuración 3: Cualquier cámara
      () => ({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false
      })
    ];

    for (const [index, config] of configuraciones.entries()) {
      const configResult = config();
      if (configResult === null) continue;

      try {
        console.log(`Intentando configuración ${index + 1}:`, configResult);
        
        this.mediaStream = await navigator.mediaDevices.getUserMedia(configResult);
        
        if (!this.mediaStream) {
          throw new Error('MediaStream es null');
        }

        const videoTracks = this.mediaStream.getVideoTracks();
        if (videoTracks.length === 0) {
          this.isCameraAvailable = false;
          throw new Error('No hay tracks de video en el stream');
        }

        this.isCameraAvailable = true;

        console.log('Cámara iniciada. Track de video:', videoTracks[0].label);

        // Asignar el stream al elemento video
        video.srcObject = this.mediaStream;

        // Esperar a que el video esté listo
        await this.waitForVideoReady(video);

        this.isCameraReady = true;
        console.log('Cámara iniciada exitosamente');
        return;

      } catch (error: any) {
        console.log(`Configuración ${index + 1} falló:`, error.message);
        lastError = error;
        
        if (this.mediaStream) {
          this.stopCamera();
        }
      }
    }

    throw lastError || new Error('Todas las configuraciones de cámara fallaron');

  } catch (error: any) {
    console.error('Error al iniciar cámara:', error);
    this.isCameraReady = false;
    throw error;
  }
}

// Método para asegurar que el elemento video esté listo
private async ensureVideoElementReady(): Promise<void> {
  const maxAttempts = 10;
  const delay = 100; // ms

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (this.videoElement && this.videoElement.nativeElement) {
      const video = this.videoElement.nativeElement;
      
      // Verificar adicionalmente que el elemento esté en el DOM
      if (document.contains(video)) {
        console.log('Elemento video disponible en el intento:', attempt);
        return;
      }
    }

    if (attempt === maxAttempts) {
      throw new Error(`Elemento video no disponible después de ${maxAttempts} intentos. Verifica que @ViewChild esté configurado correctamente.`);
    }

    console.log(`Esperando por elemento video... intento ${attempt}`);
    await this.delay(delay);
  }
}

// Método auxiliar para delay
private delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

private waitForVideoReady(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    if (video.readyState >= 2) { // HAVE_CURRENT_DATA o mayor
      resolve();
      return;
    }

    const onLoadedMetadata = () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      resolve();
    };

    const onError = () => {
      video.removeEventListener('error', onError);
      resolve(); // Resolvemos igual para no bloquear
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('error', onError);

    // Timeout de seguridad
    setTimeout(() => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('error', onError);
      resolve();
    }, 3000);
  });
}


// Método stopCamera mejorado
stopCamera(): void {
  if (this.mediaStream) {
    console.log('Deteniendo cámara...');
    this.mediaStream.getTracks().forEach(track => {
      console.log('Deteniendo track:', track.kind, track.label);
      track.stop();
    });
    this.mediaStream = null;
  }

  if (this.videoElement && this.videoElement.nativeElement) {
    this.videoElement.nativeElement.srcObject = null;
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
