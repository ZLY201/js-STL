import { Container } from '@/container/ContainerBase';

abstract class SequentialContainer<T> extends Container<T> {
  /**
   * @description Push the element to the back.
   * @param element The element you want to push.
   */
  abstract pushBack(element: T): void;
  /**
   * @description Removes the last element.
   */
  abstract popBack(): void;
  /**
   * @description Sets element by position.
   * @param pos The position you want to change.
   * @param element The element's value you want to update.
   * @example container.setElementByPos(-1, 1); // throw a RangeError
   */
  abstract setElementByPos(pos: number, element: T): void;
  /**
   * @description Removes the elements of the specified value.
   * @param value The value you want to remove.
   * @example container.eraseElementByValue(-1);
   */
  abstract eraseElementByValue(value: T): void;
  /**
   * @description Insert several elements after the specified position.
   * @param pos The position you want to insert.
   * @param element The element you want to insert.
   * @param num The number of elements you want to insert (default 1).
   * @example
   * const container = new Vector([1, 2, 3]);
   * container.insert(1, 4);  // [1, 4, 2, 3]
   * container.insert(1, 5, 3); // [1, 5, 5, 5, 4, 2, 3]
   */
  abstract insert(pos: number, element: T, num?: number): void;
  /**
   * @description Reverses the container.
   * @example
   * const container = new Vector([1, 2, 3]);
   * container.reverse(); // [3, 2, 1]
   */
  abstract reverse(): void;
  /**
   * @description Removes the duplication of elements in the container.
   * @example
   * const container = new Vector([1, 1, 3, 2, 2, 5, 5, 2]);
   * container.unique(); // [1, 3, 2, 5, 2]
   */
  abstract unique(): void;
  /**
   * @description Sort the container.
   * @param cmp Comparison function.
   * @example
   * const container = new Vector([3, 1, 10]);
   * container.sort();  // [1, 10, 3]
   * container.sort((x, y) => x - y); // [1, 3, 10]
   */
  abstract sort(cmp?: (x: T, y: T) => number): void;
}

export default SequentialContainer;
