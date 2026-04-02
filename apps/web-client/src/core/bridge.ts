import mitt, { Emitter, EventType } from 'mitt';

type Events = {
  [key: string]: any;
};

const emitter: Emitter<Events> = mitt<Events>();

export const bridge = {
  on: emitter.on,
  off: emitter.off,
  emit: emitter.emit,
  all: emitter.all,
};

export default bridge;
