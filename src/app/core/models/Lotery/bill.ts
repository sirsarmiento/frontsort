

export class Bill { 
    id?: number;
    numero: string;
    fecha: Date;
    hora: number;
    monto: number;
    montoMin: number;
    tasa: number;
    local: number;
    user: number;
    print: number;
    cliente?: ClientBill;
}

export class ClientBill {
    tipoDocumentoIdentidad: string;
    nroDocumentoIdentidad: string;
    nombreCompleto: string;
    fotoCedula: string;
}