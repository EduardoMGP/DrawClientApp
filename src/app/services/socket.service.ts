import {Injectable} from '@angular/core';
import {ResponseCode} from "./ResponseCode";
@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private static socket: WebSocket | undefined;

  constructor() {
  }

  public static connect() {

    if (window.location.protocol === "http:") {
      SocketService.socket = new WebSocket('ws://' + window.location.hostname + ':8086')
    } else if (window.location.protocol === "https:") {
      SocketService.socket = new WebSocket('wss://' + window.location.hostname + ':8086')
    }

    if (SocketService.socket) {
      console.log("Iniciando conexão")
      SocketService.socket.addEventListener('open', function (event) {
        console.log('Conexão WebSocket aberta:', event);
      });

      SocketService.socket.addEventListener('message', function (event) {
        dispatchEvent(new CustomEvent("onMessage", {detail: event.data}));
      });

      SocketService.socket.addEventListener('error', function (event) {
        console.error('Erro na conexão WebSocket:', event);
        SocketService.connect();
      });
    }

  }

  static removeEvent(event: any) {
    if (event)
      removeEventListener('onMessage', event);
  }

  static on(param: (data: any) => void): any {
    let eventHandler = (event: any) => {
      event = JSON.parse(event.detail);
      event.code = ResponseCode[event.code];
      param(event);
    }
    addEventListener('onMessage', eventHandler);

    return eventHandler;
  }

  private static send(obj: { action: string; data?: object }) {
    new Promise((resolve, reject) => {

      let count = 0;
      let interval = setInterval(() => {
        if (SocketService.socket?.readyState === 1) {
          SocketService.socket?.send(JSON.stringify(obj));
          clearInterval(interval);
          resolve(true);
        } else {
          count++;
          if (count > 10) {
            clearInterval(interval);
            reject(false);
          }
        }

      }, 1000);

    }).then((value) => {
      console.log("Enviado com sucesso")
    }).catch((reason) => {
      console.log("Erro ao enviar")
    });
  }

  public static createParty() {
    SocketService.send({action: 'PARTY_CREATE'});
  }

  private static chunk_block = 0;

  public static sendDrawn(party_name: string, history: any) {
    console.log("Enviando desenho" + history)

      SocketService.send({
        action: 'DRAWING',
        data: {
          'partyName': party_name,
          'chunk': JSON.stringify(history)
        }
      });

  }

  static leaveParty(party_name: string) {
    SocketService.send({
      action: 'PARTY_DISCONNECT',
      data: {'partyName': party_name}
    });
  }

  static joinParty(sala: string) {
    SocketService.send({
      action: 'PARTY_CONNECT',
      data: {'partyName': sala}
    })
  }

  static listParties() {
    SocketService.send({
      action: 'PARTY_LIST'
    })
  }
}

