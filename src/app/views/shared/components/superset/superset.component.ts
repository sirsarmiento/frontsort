import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { embedDashboard } from "@superset-ui/embedded-sdk";
import { SupersetService } from '../../../../core/services/superset.service';

@Component({
  selector: 'app-superset',
  templateUrl: './superset.component.html',
  styleUrls: ['./superset.component.scss']
})
export class SupersetComponent implements OnInit {
  id: string;

  constructor(private route: ActivatedRoute,
    public superSetService: SupersetService) { }

  ngOnInit(): void {

    this.id = '5d3cf327-a7a1-427f-8dc2-c725131ab48e';

    this.getSupersetDashboard(this.id)

  }



  async fetchTokenFromBackend() {
    //return await this.superSetService.getTokenPublic();
  }

  async fetchGuestTokenFromBackend(token, id) {
    //return await this.superSetService.getGuestTokenPublic(token,id);
  }


  async getSupersetDashboard(id: any) {

    const data: any = (await this.superSetService.getTokenPublic()).subscribe(async (resp: any) => {
      console.log("Token 1", resp);
      if (resp.access_token) {
        (await this.superSetService.getGuestTokenPublic(resp.access_token, id)).subscribe((dataSecondToken: any) => {
          console.log("Token 2", dataSecondToken);

          if (dataSecondToken && dataSecondToken.token) {
            const dashboardContainer = document.getElementById(id);
            if (dashboardContainer) {
              embedDashboard({
                id: id, // given by the Superset embedding UI
                supersetDomain: "https://psuperset.pafar.com.ve",
                mountPoint: dashboardContainer, // any html element that can contain an iframe
                fetchGuestToken: async () => dataSecondToken.token,
                dashboardUiConfig: { hideTitle: true, hideChartControls: false }, // dashboard UI config: hideTitle, hideTab, hideChartControls (optional)
              });
            }

          }

        });


      }
    });

  }


}
