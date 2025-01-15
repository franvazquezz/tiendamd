import { Component, OnInit } from '@angular/core'
import { TrpcService } from '../../services/trpc.service'

@Component({
  selector: 'app-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss'],
})
export class ExampleComponent implements OnInit {
  message: { id: string; name: string } = { id: '', name: '' }
  sum = 0

  constructor(private trpcService: TrpcService) {}

  ngOnInit(): void {
    this.fetchUser()
  }

  async fetchUser(): Promise<void> {
    this.message = await this.trpcService.getUser('4')
  }
}
