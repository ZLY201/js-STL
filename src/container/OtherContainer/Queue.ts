import { Base, initContainer } from '@/container/ContainerBase';

const enum QUEUE_CONSTANT {
  MIN_ALLOCATE_SIZE = (1 << 12),
  ALLOCATE_SIGMA = 0.75
}

class Queue<T> extends Base {
  /**
   * @internal
   */
  private _queue: T[] = [];
  /**
   * @internal
   */
  private _first = 0;
  constructor(container: initContainer<T> = []) {
    super();
    const self = this;
    container.forEach(function (el) {
      self.push(el);
    });
  }
  private _reAllocate() {
    const capacity = this._queue.length;
    if (
      this._length / capacity < QUEUE_CONSTANT.ALLOCATE_SIGMA &&
      capacity > QUEUE_CONSTANT.MIN_ALLOCATE_SIZE
    ) {
      const length = this._length;
      for (let i = 0; i < length; ++i) {
        this._queue[i] = this._queue[this._first + i];
      }
      this._first = 0;
    }
  }
  clear() {
    this._queue = [];
    this._length = this._first = 0;
  }
  /**
   * @description Inserts element to queue's end.
   * @param element - The element you want to push to the front.
   * @returns The container length after pushing.
   */
  push(element: T) {
    this._queue.push(element);
    this._length += 1;
    this._reAllocate();
    return this._length;
  }
  /**
   * @description Removes the first element.
   * @returns The element you popped.
   */
  pop() {
    if (this._length === 0) return;
    const el = this._queue[this._first];
    delete this._queue[this._first++];
    this._length -= 1;
    this._reAllocate();
    return el;
  }
  /**
   * @description Access the first element.
   * @returns The first element.
   */
  front(): T | undefined {
    return this._queue[this._first];
  }
}

export default Queue;
