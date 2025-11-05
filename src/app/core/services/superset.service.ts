import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SupersetService{
  superset_config = {
    url:"https://psuperset.pafar.com.ve/api/v1/",
    username: "giep",
    first_name: "giep",
    last_name: "giep",
    password: "pafarco1"
}//environment.superset;

  constructor(protected http: HttpClient) {}


  async getTokenPublic(){
    
    if (this.superset_config) {
      let uri = `${this.superset_config.url}security/login`;
      let body = {
        'password': this.superset_config.password,
        'provider': 'db',
        'refresh': false,
        'username': this.superset_config.username,
      };
      return this.http.post(uri, body);
    }else{
      return null;
    }
  }

  async getGuestTokenPublic(token: string, id: string){
    let uri = `${this.superset_config.url}security/guest_token/`;
    let body = {
      'resources': [
        {
          'id': id,
          'type': 'dashboard'
        }
      ],
      'rls': [
      ],
      'user': {
        'first_name': this.superset_config.first_name,
        'last_name': this.superset_config.last_name,
        'username': this.superset_config.username
      }
    };
    const config = {
      headers: { Authorization: `Bearer ${token}`}
    };
    return this.http.post(uri,body, config);
  }


}
