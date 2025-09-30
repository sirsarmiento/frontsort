export const environment = {
  production: true,
  ttl: 28800000,
  name_system: 'PAFAR',
  apiUrl: 'https://bofficecostosstage.pafar.com.ve/public/api',
  apiAuth: 'https://bofficecostosstage.pafar.com.ve/public',
  appUrl: 'https://bofficecostosstage.pafar.com.ve/',
  wsserver:"https://wsplatformprod.pafar.com.ve",
  localstorage:{
    userKey : 'cusr'
  },
  form: {
    url: {
      validations: {
        pattern: '^(https?|http):\\/\\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\\.)*[a-zA-Z0-9-]+\\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2,10}))(:[0-9]+)*(\\/($|[a-zA-Z0-9.,?\'\\\\+&%$#=~_-]+))*$'
      }
    },
    password: {
      validations: {
        pattern: '^(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&.+=*]).*$',
      }
    },
    number: {
      validations: {
        pattern: '^[0-9]*$',
      }
    },
    double: {
      validations: {
        pattern: '^[0-9\.]*$',
      }
    },
    alphanumeric: {
      validations: {
        pattern: '^[a-zA-Z0-9]*$',
      }
    },
    alphanumeric_guion: {
      validations: {
        pattern: '^[a-zA-Z0-9\-]*$',
      }
    },
    number_guion: {
      validations: {
        pattern: '^[0-9\-]*$',
      }
    },
    role_pattern:{
      validations: {
        pattern: '(ROLE)[A-Z\_]+',
      }
    },
    file_extension:['doc', 'docx', 'pdf','xls', 'xlsx', 'png', 'jpg', 'jpge'],
    file_imagen_extension:['png', 'jpg', 'jpge'],
    file_acordo_extension:['pdf'],
    file_extension_pdf: ['pdf'],
    file_extension_excel:['xls', 'xlsx']
  },
  paginator: {
    default_page: 1,
    row_per_page: 10
  },
  endpoints:{
    handle_error_blackList:[
      '/login_check',
      '/recovery-password',
      '/changepassword'
    ],
    handler_auth_whiteList:[
      '/recovery-password',
      '/changepassword'
    ]
  }
};