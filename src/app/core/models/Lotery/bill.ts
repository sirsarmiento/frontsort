

export class Bill { 
    id?: number;
    numero: string;
    fecha: string;
    hora: string;
    monto: number;
    montoMin: number;
    tasa: number;
    local: number;
    user: number;
    print: number;
    tickets: number;
    cliente?: ClientBill;
    localBill?: LocalBill;
}

export class ClientBill {
    tipoDocumentoIdentidad: string;
    nroDocumentoIdentidad: string;
    nombreCompleto: string;
    telefono: string;
    telefonoId: number;
    fotoCedula: string;
}

export class LocalBill {
    id: number;
    nombre: string;
}

export class BillQr { 
    id?: number;
    numero: string;
    fecha: Date;
    hora: string;
    monto: number;
    montoMin: number;
    tasa: number;
    user: number;
    print: number;
    cliente?: ClientBill;
    local?: LocalBill;
}