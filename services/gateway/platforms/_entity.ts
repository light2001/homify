import { IMqttMessage } from "@/types/mqtt.model";
import EventBus from "core/EventBus";
import homify from "core/homify";
import * as R from "ramda";
import { createDebug } from "services/debug.service";

const log = createDebug("Entity");

export interface EntityObject {
  entityId: string;
  name: string;
  state: boolean;
  icon: string;
  image: string;
  type: string;
  group: string;
  available: boolean;
  stateLastUpdate: Date;
}
export default abstract class Entity {
  public abstract entityId: string;
  public abstract defaultName: string;
  public stateAttrs: any[];
  public icon: string;
  public image: string;
  public type: string;
  public abstract available: boolean = false;
  public _state: boolean;
  public stateLastUpdate: Date;
  public typeAttrs: {};

  get state() {
    return this._state;
  }

  set state(newState) {
    if (newState !== this._state) {
      EventBus.broadcastStateChange(this.entityId, newState).subscribe();
    }
    this.stateLastUpdate = new Date();
    this._state = newState;
  }

  public register = () => {
    EventBus.serviceRegister(this.entityId)
      .subscribe((packet: IMqttMessage) => {
        const { topic, payload } = packet;
        const service = JSON.parse(payload.toString());
        log(topic, service);
        this.serviceHandler(service);
      });
  }

  public toObject(): EntityObject {
    const name = R.pathOr(this.defaultName, ["name"], homify.getEntityById(this.entityId));
    const group = R.pathOr("", ["group"], homify.getEntityById(this.entityId));

    return {
      entityId: this.entityId,
      name,
      state: this.state,
      icon: this.icon,
      image: this.image,
      type: this.type,
      group,
      available: this.available,
      stateLastUpdate: this.stateLastUpdate,
    };
  }

  public abstract serviceHandler(service);
}
