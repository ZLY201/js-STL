import {
  Vector,
  LinkList,
  Deque,
  OrderedSet,
  OrderedMap,
  Container,
  ContainerIterator
} from '@/index';

let arr: number[] = [];
const testNum = 10000;
for (let i = 0; i < testNum; ++i) {
  arr.push(Math.floor(Math.random() * testNum));
}
arr = Array.from(new Set(arr));
arr.sort((x, y) => x - y);

const containerArr: Container<unknown>[] = [
  new Vector(arr),
  new LinkList(arr),
  new Deque(arr),
  new OrderedSet(arr),
  new OrderedMap(arr.map((element, index) => [index, element]))
];

describe('iterator test', () => {
  test('normal iterator next function test', () => {
    for (const container of containerArr) {
      let index = 0;
      for (let it = container.begin() as ContainerIterator<unknown>;
        !it.equals(container.end() as ContainerIterator<unknown>);
        it = it.next()) {
        if (container instanceof OrderedMap) {
          expect((it as ContainerIterator<[number, number]>).pointer[1])
            .toEqual(arr[index++]);
        } else {
          expect(it.pointer).toEqual(arr[index++]);
        }
      }
    }
  });

  test('normal iterator pre function test', () => {
    for (const container of containerArr) {
      let index = arr.length - 1;
      for (let it = container.end().pre() as ContainerIterator<unknown>;
        !it.equals(container.begin() as ContainerIterator<unknown>);
        it = it.pre()) {
        if (container instanceof OrderedMap) {
          expect((it as ContainerIterator<[number, number]>).pointer[1])
            .toEqual(arr[index--]);
        } else {
          expect(it.pointer).toEqual(arr[index--]);
        }
      }
    }
  });

  test('reverse iterator next function test', () => {
    for (const container of containerArr) {
      let index = arr.length - 1;
      for (let it = container.rBegin() as ContainerIterator<unknown>;
        !it.equals(container.rEnd() as ContainerIterator<unknown>);
        it = it.next()) {
        if (container instanceof OrderedMap) {
          expect((it as ContainerIterator<[number, number]>).pointer[1])
            .toEqual(arr[index--]);
        } else {
          expect(it.pointer).toEqual(arr[index--]);
        }
      }
    }
  });

  test('reverse iterator pre function test', () => {
    for (const container of containerArr) {
      let index = 0;
      for (let it = container.rEnd().pre() as ContainerIterator<unknown>;
        !it.equals(container.rBegin() as ContainerIterator<unknown>);
        it = it.pre()) {
        if (container instanceof OrderedMap) {
          expect((it as ContainerIterator<[number, number]>).pointer[1])
            .toEqual(arr[index++]);
        } else {
          expect(it.pointer).toEqual(arr[index++]);
        }
      }
    }
  });

  for (const container of containerArr) {
    test('normal iterator next run time error test', () => {
      expect(() => container.end().next()).toThrowError(RangeError);
    });

    test('normal iterator pre run time error test', () => {
      expect(() => container.begin().pre()).toThrowError(RangeError);
    });

    test('reverse iterator next run time error test', () => {
      expect(() => container.rEnd().next()).toThrowError(RangeError);
    });

    test('reverse iterator pre run time error test', () => {
      expect(() => container.rBegin().pre()).toThrowError(RangeError);
    });
  }

  test('copy test', () => {
    for (const container of containerArr) {
      const iter = container.begin() as ContainerIterator<unknown>;
      const copy = iter.copy() as ContainerIterator<unknown>;
      iter.next();
      expect(iter.equals(copy)).toBe(false);
      copy.next();
      expect(iter.equals(copy)).toBe(true);
    }
    for (const container of containerArr) {
      const iter = container.end() as ContainerIterator<unknown>;
      const copy = iter.copy() as ContainerIterator<unknown>;
      iter.pre();
      expect(iter.equals(copy)).toBe(false);
      copy.pre();
      expect(iter.equals(copy)).toBe(true);
    }
    for (const container of containerArr) {
      const iter = container.rBegin() as ContainerIterator<unknown>;
      const copy = iter.copy() as ContainerIterator<unknown>;
      iter.next();
      expect(iter.equals(copy)).toBe(false);
      copy.next();
      expect(iter.equals(copy)).toBe(true);
    }
    for (const container of containerArr) {
      const iter = container.rEnd() as ContainerIterator<unknown>;
      const copy = iter.copy() as ContainerIterator<unknown>;
      iter.pre();
      expect(iter.equals(copy)).toBe(false);
      copy.pre();
      expect(iter.equals(copy)).toBe(true);
    }
  });
});
