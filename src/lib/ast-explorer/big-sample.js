import { readFile } from 'node:fs/promises';
import { debounce } from 'lodash-es';
import confetti from 'canvas-confetti';
import { join } from './paths.js';
export { join } from './paths.js';
export * from 'nanoid';

export function handler_0(input) {
  const scaled = input.map((x) => x * 1 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 0 }), 0);
}

export function handler_1(input) {
  const scaled = input.map((x) => x * 2 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 1 }), 1);
}

export function handler_2(input) {
  const scaled = input.map((x) => x * 3 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 2 }), 2);
}

export function handler_3(input) {
  const scaled = input.map((x) => x * 4 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 3 }), 3);
}

export function handler_4(input) {
  const scaled = input.map((x) => x * 5 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 4 }), 4);
}

export function handler_5(input) {
  const scaled = input.map((x) => x * 6 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 5 }), 5);
}

export function handler_6(input) {
  const scaled = input.map((x) => x * 7 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 6 }), 6);
}

export function handler_7(input) {
  const scaled = input.map((x) => x * 8 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 7 }), 7);
}

export function handler_8(input) {
  const scaled = input.map((x) => x * 9 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 8 }), 8);
}

export function handler_9(input) {
  const scaled = input.map((x) => x * 10 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 9 }), 9);
}

export function handler_10(input) {
  const scaled = input.map((x) => x * 11 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 10 }), 10);
}

export function handler_11(input) {
  const scaled = input.map((x) => x * 12 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 11 }), 11);
}

export function handler_12(input) {
  const scaled = input.map((x) => x * 13 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 12 }), 12);
}

export function handler_13(input) {
  const scaled = input.map((x) => x * 14 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 13 }), 13);
}

export function handler_14(input) {
  const scaled = input.map((x) => x * 15 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 14 }), 14);
}

export function handler_15(input) {
  const scaled = input.map((x) => x * 16 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 15 }), 15);
}

export function handler_16(input) {
  const scaled = input.map((x) => x * 17 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 16 }), 16);
}

export function handler_17(input) {
  const scaled = input.map((x) => x * 18 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 17 }), 17);
}

export function handler_18(input) {
  const scaled = input.map((x) => x * 19 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 18 }), 18);
}

export function handler_19(input) {
  const scaled = input.map((x) => x * 20 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 19 }), 19);
}

export function handler_20(input) {
  const scaled = input.map((x) => x * 21 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 20 }), 20);
}

export function handler_21(input) {
  const scaled = input.map((x) => x * 22 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 21 }), 21);
}

export function handler_22(input) {
  const scaled = input.map((x) => x * 23 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 22 }), 22);
}

export function handler_23(input) {
  const scaled = input.map((x) => x * 24 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 23 }), 23);
}

export function handler_24(input) {
  const scaled = input.map((x) => x * 25 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 24 }), 24);
}

export function handler_25(input) {
  const scaled = input.map((x) => x * 26 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 25 }), 25);
}

export function handler_26(input) {
  const scaled = input.map((x) => x * 27 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 26 }), 26);
}

export function handler_27(input) {
  const scaled = input.map((x) => x * 28 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 27 }), 27);
}

export function handler_28(input) {
  const scaled = input.map((x) => x * 29 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 28 }), 28);
}

export function handler_29(input) {
  const scaled = input.map((x) => x * 30 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 29 }), 29);
}

export function handler_30(input) {
  const scaled = input.map((x) => x * 31 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 30 }), 30);
}

export function handler_31(input) {
  const scaled = input.map((x) => x * 32 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 31 }), 31);
}

export function handler_32(input) {
  const scaled = input.map((x) => x * 33 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 32 }), 32);
}

export function handler_33(input) {
  const scaled = input.map((x) => x * 34 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 33 }), 33);
}

export function handler_34(input) {
  const scaled = input.map((x) => x * 35 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 34 }), 34);
}

export function handler_35(input) {
  const scaled = input.map((x) => x * 36 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 35 }), 35);
}

export function handler_36(input) {
  const scaled = input.map((x) => x * 37 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 36 }), 36);
}

export function handler_37(input) {
  const scaled = input.map((x) => x * 38 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 37 }), 37);
}

export function handler_38(input) {
  const scaled = input.map((x) => x * 39 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 38 }), 38);
}

export function handler_39(input) {
  const scaled = input.map((x) => x * 40 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 39 }), 39);
}

export function handler_40(input) {
  const scaled = input.map((x) => x * 41 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 40 }), 40);
}

export function handler_41(input) {
  const scaled = input.map((x) => x * 42 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 41 }), 41);
}

export function handler_42(input) {
  const scaled = input.map((x) => x * 43 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 42 }), 42);
}

export function handler_43(input) {
  const scaled = input.map((x) => x * 44 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 43 }), 43);
}

export function handler_44(input) {
  const scaled = input.map((x) => x * 45 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 44 }), 44);
}

export function handler_45(input) {
  const scaled = input.map((x) => x * 46 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 45 }), 45);
}

export function handler_46(input) {
  const scaled = input.map((x) => x * 47 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 46 }), 46);
}

export function handler_47(input) {
  const scaled = input.map((x) => x * 48 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 47 }), 47);
}

export function handler_48(input) {
  const scaled = input.map((x) => x * 49 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 48 }), 48);
}

export function handler_49(input) {
  const scaled = input.map((x) => x * 50 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 49 }), 49);
}

export function handler_50(input) {
  const scaled = input.map((x) => x * 51 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 50 }), 0);
}

export function handler_51(input) {
  const scaled = input.map((x) => x * 52 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 51 }), 1);
}

export function handler_52(input) {
  const scaled = input.map((x) => x * 53 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 52 }), 2);
}

export function handler_53(input) {
  const scaled = input.map((x) => x * 54 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 53 }), 3);
}

export function handler_54(input) {
  const scaled = input.map((x) => x * 55 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 54 }), 4);
}

export function handler_55(input) {
  const scaled = input.map((x) => x * 56 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 55 }), 5);
}

export function handler_56(input) {
  const scaled = input.map((x) => x * 57 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 56 }), 6);
}

export function handler_57(input) {
  const scaled = input.map((x) => x * 58 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 57 }), 7);
}

export function handler_58(input) {
  const scaled = input.map((x) => x * 59 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 58 }), 8);
}

export function handler_59(input) {
  const scaled = input.map((x) => x * 60 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 59 }), 9);
}

export function handler_60(input) {
  const scaled = input.map((x) => x * 61 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 60 }), 10);
}

export function handler_61(input) {
  const scaled = input.map((x) => x * 62 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 61 }), 11);
}

export function handler_62(input) {
  const scaled = input.map((x) => x * 63 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 62 }), 12);
}

export function handler_63(input) {
  const scaled = input.map((x) => x * 64 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 63 }), 13);
}

export function handler_64(input) {
  const scaled = input.map((x) => x * 65 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 64 }), 14);
}

export function handler_65(input) {
  const scaled = input.map((x) => x * 66 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 65 }), 15);
}

export function handler_66(input) {
  const scaled = input.map((x) => x * 67 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 66 }), 16);
}

export function handler_67(input) {
  const scaled = input.map((x) => x * 68 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 67 }), 17);
}

export function handler_68(input) {
  const scaled = input.map((x) => x * 69 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 68 }), 18);
}

export function handler_69(input) {
  const scaled = input.map((x) => x * 70 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 69 }), 19);
}

export function handler_70(input) {
  const scaled = input.map((x) => x * 71 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 70 }), 20);
}

export function handler_71(input) {
  const scaled = input.map((x) => x * 72 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 71 }), 21);
}

export function handler_72(input) {
  const scaled = input.map((x) => x * 73 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 72 }), 22);
}

export function handler_73(input) {
  const scaled = input.map((x) => x * 74 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 73 }), 23);
}

export function handler_74(input) {
  const scaled = input.map((x) => x * 75 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 74 }), 24);
}

export function handler_75(input) {
  const scaled = input.map((x) => x * 76 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 75 }), 25);
}

export function handler_76(input) {
  const scaled = input.map((x) => x * 77 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 76 }), 26);
}

export function handler_77(input) {
  const scaled = input.map((x) => x * 78 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 77 }), 27);
}

export function handler_78(input) {
  const scaled = input.map((x) => x * 79 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 78 }), 28);
}

export function handler_79(input) {
  const scaled = input.map((x) => x * 80 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 79 }), 29);
}

export function handler_80(input) {
  const scaled = input.map((x) => x * 81 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 80 }), 30);
}

export function handler_81(input) {
  const scaled = input.map((x) => x * 82 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 81 }), 31);
}

export function handler_82(input) {
  const scaled = input.map((x) => x * 83 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 82 }), 32);
}

export function handler_83(input) {
  const scaled = input.map((x) => x * 84 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 83 }), 33);
}

export function handler_84(input) {
  const scaled = input.map((x) => x * 85 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 84 }), 34);
}

export function handler_85(input) {
  const scaled = input.map((x) => x * 86 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 85 }), 35);
}

export function handler_86(input) {
  const scaled = input.map((x) => x * 87 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 86 }), 36);
}

export function handler_87(input) {
  const scaled = input.map((x) => x * 88 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 87 }), 37);
}

export function handler_88(input) {
  const scaled = input.map((x) => x * 89 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 88 }), 38);
}

export function handler_89(input) {
  const scaled = input.map((x) => x * 90 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 89 }), 39);
}

export function handler_90(input) {
  const scaled = input.map((x) => x * 91 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 90 }), 40);
}

export function handler_91(input) {
  const scaled = input.map((x) => x * 92 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 91 }), 41);
}

export function handler_92(input) {
  const scaled = input.map((x) => x * 93 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 92 }), 42);
}

export function handler_93(input) {
  const scaled = input.map((x) => x * 94 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 93 }), 43);
}

export function handler_94(input) {
  const scaled = input.map((x) => x * 95 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 94 }), 44);
}

export function handler_95(input) {
  const scaled = input.map((x) => x * 96 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 95 }), 45);
}

export function handler_96(input) {
  const scaled = input.map((x) => x * 97 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 96 }), 46);
}

export function handler_97(input) {
  const scaled = input.map((x) => x * 98 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 97 }), 47);
}

export function handler_98(input) {
  const scaled = input.map((x) => x * 99 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 98 }), 48);
}

export function handler_99(input) {
  const scaled = input.map((x) => x * 100 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 99 }), 49);
}

export function handler_100(input) {
  const scaled = input.map((x) => x * 101 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 100 }), 0);
}

export function handler_101(input) {
  const scaled = input.map((x) => x * 102 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 101 }), 1);
}

export function handler_102(input) {
  const scaled = input.map((x) => x * 103 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 102 }), 2);
}

export function handler_103(input) {
  const scaled = input.map((x) => x * 104 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 103 }), 3);
}

export function handler_104(input) {
  const scaled = input.map((x) => x * 105 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 104 }), 4);
}

export function handler_105(input) {
  const scaled = input.map((x) => x * 106 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 105 }), 5);
}

export function handler_106(input) {
  const scaled = input.map((x) => x * 107 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 106 }), 6);
}

export function handler_107(input) {
  const scaled = input.map((x) => x * 108 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 107 }), 7);
}

export function handler_108(input) {
  const scaled = input.map((x) => x * 109 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 108 }), 8);
}

export function handler_109(input) {
  const scaled = input.map((x) => x * 110 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 109 }), 9);
}

export function handler_110(input) {
  const scaled = input.map((x) => x * 111 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 110 }), 10);
}

export function handler_111(input) {
  const scaled = input.map((x) => x * 112 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 111 }), 11);
}

export function handler_112(input) {
  const scaled = input.map((x) => x * 113 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 112 }), 12);
}

export function handler_113(input) {
  const scaled = input.map((x) => x * 114 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 113 }), 13);
}

export function handler_114(input) {
  const scaled = input.map((x) => x * 115 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 114 }), 14);
}

export function handler_115(input) {
  const scaled = input.map((x) => x * 116 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 115 }), 15);
}

export function handler_116(input) {
  const scaled = input.map((x) => x * 117 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 116 }), 16);
}

export function handler_117(input) {
  const scaled = input.map((x) => x * 118 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 117 }), 17);
}

export function handler_118(input) {
  const scaled = input.map((x) => x * 119 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 118 }), 18);
}

export function handler_119(input) {
  const scaled = input.map((x) => x * 120 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 119 }), 19);
}

export function handler_120(input) {
  const scaled = input.map((x) => x * 121 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 120 }), 20);
}

export function handler_121(input) {
  const scaled = input.map((x) => x * 122 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 121 }), 21);
}

export function handler_122(input) {
  const scaled = input.map((x) => x * 123 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 122 }), 22);
}

export function handler_123(input) {
  const scaled = input.map((x) => x * 124 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 123 }), 23);
}

export function handler_124(input) {
  const scaled = input.map((x) => x * 125 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 124 }), 24);
}

export function handler_125(input) {
  const scaled = input.map((x) => x * 126 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 125 }), 25);
}

export function handler_126(input) {
  const scaled = input.map((x) => x * 127 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 126 }), 26);
}

export function handler_127(input) {
  const scaled = input.map((x) => x * 128 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 127 }), 27);
}

export function handler_128(input) {
  const scaled = input.map((x) => x * 129 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 128 }), 28);
}

export function handler_129(input) {
  const scaled = input.map((x) => x * 130 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 129 }), 29);
}

export function handler_130(input) {
  const scaled = input.map((x) => x * 131 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 130 }), 30);
}

export function handler_131(input) {
  const scaled = input.map((x) => x * 132 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 131 }), 31);
}

export function handler_132(input) {
  const scaled = input.map((x) => x * 133 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 132 }), 32);
}

export function handler_133(input) {
  const scaled = input.map((x) => x * 134 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 133 }), 33);
}

export function handler_134(input) {
  const scaled = input.map((x) => x * 135 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 134 }), 34);
}

export function handler_135(input) {
  const scaled = input.map((x) => x * 136 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 135 }), 35);
}

export function handler_136(input) {
  const scaled = input.map((x) => x * 137 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 136 }), 36);
}

export function handler_137(input) {
  const scaled = input.map((x) => x * 138 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 137 }), 37);
}

export function handler_138(input) {
  const scaled = input.map((x) => x * 139 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 138 }), 38);
}

export function handler_139(input) {
  const scaled = input.map((x) => x * 140 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 139 }), 39);
}

export function handler_140(input) {
  const scaled = input.map((x) => x * 141 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 140 }), 40);
}

export function handler_141(input) {
  const scaled = input.map((x) => x * 142 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 141 }), 41);
}

export function handler_142(input) {
  const scaled = input.map((x) => x * 143 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 142 }), 42);
}

export function handler_143(input) {
  const scaled = input.map((x) => x * 144 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 143 }), 43);
}

export function handler_144(input) {
  const scaled = input.map((x) => x * 145 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 144 }), 44);
}

export function handler_145(input) {
  const scaled = input.map((x) => x * 146 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 145 }), 45);
}

export function handler_146(input) {
  const scaled = input.map((x) => x * 147 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 146 }), 46);
}

export function handler_147(input) {
  const scaled = input.map((x) => x * 148 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 147 }), 47);
}

export function handler_148(input) {
  const scaled = input.map((x) => x * 149 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 148 }), 48);
}

export function handler_149(input) {
  const scaled = input.map((x) => x * 150 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 149 }), 49);
}

export function handler_150(input) {
  const scaled = input.map((x) => x * 151 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 150 }), 0);
}

export function handler_151(input) {
  const scaled = input.map((x) => x * 152 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 151 }), 1);
}

export function handler_152(input) {
  const scaled = input.map((x) => x * 153 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 152 }), 2);
}

export function handler_153(input) {
  const scaled = input.map((x) => x * 154 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 153 }), 3);
}

export function handler_154(input) {
  const scaled = input.map((x) => x * 155 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 154 }), 4);
}

export function handler_155(input) {
  const scaled = input.map((x) => x * 156 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 155 }), 5);
}

export function handler_156(input) {
  const scaled = input.map((x) => x * 157 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 156 }), 6);
}

export function handler_157(input) {
  const scaled = input.map((x) => x * 158 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 157 }), 7);
}

export function handler_158(input) {
  const scaled = input.map((x) => x * 159 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 158 }), 8);
}

export function handler_159(input) {
  const scaled = input.map((x) => x * 160 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 159 }), 9);
}

export function handler_160(input) {
  const scaled = input.map((x) => x * 161 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 160 }), 10);
}

export function handler_161(input) {
  const scaled = input.map((x) => x * 162 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 161 }), 11);
}

export function handler_162(input) {
  const scaled = input.map((x) => x * 163 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 162 }), 12);
}

export function handler_163(input) {
  const scaled = input.map((x) => x * 164 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 163 }), 13);
}

export function handler_164(input) {
  const scaled = input.map((x) => x * 165 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 164 }), 14);
}

export function handler_165(input) {
  const scaled = input.map((x) => x * 166 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 165 }), 15);
}

export function handler_166(input) {
  const scaled = input.map((x) => x * 167 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 166 }), 16);
}

export function handler_167(input) {
  const scaled = input.map((x) => x * 168 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 167 }), 17);
}

export function handler_168(input) {
  const scaled = input.map((x) => x * 169 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 168 }), 18);
}

export function handler_169(input) {
  const scaled = input.map((x) => x * 170 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 169 }), 19);
}

export function handler_170(input) {
  const scaled = input.map((x) => x * 171 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 170 }), 20);
}

export function handler_171(input) {
  const scaled = input.map((x) => x * 172 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 171 }), 21);
}

export function handler_172(input) {
  const scaled = input.map((x) => x * 173 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 172 }), 22);
}

export function handler_173(input) {
  const scaled = input.map((x) => x * 174 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 173 }), 23);
}

export function handler_174(input) {
  const scaled = input.map((x) => x * 175 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 174 }), 24);
}

export function handler_175(input) {
  const scaled = input.map((x) => x * 176 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 175 }), 25);
}

export function handler_176(input) {
  const scaled = input.map((x) => x * 177 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 176 }), 26);
}

export function handler_177(input) {
  const scaled = input.map((x) => x * 178 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 177 }), 27);
}

export function handler_178(input) {
  const scaled = input.map((x) => x * 179 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 178 }), 28);
}

export function handler_179(input) {
  const scaled = input.map((x) => x * 180 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 179 }), 29);
}

export function handler_180(input) {
  const scaled = input.map((x) => x * 181 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 180 }), 30);
}

export function handler_181(input) {
  const scaled = input.map((x) => x * 182 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 181 }), 31);
}

export function handler_182(input) {
  const scaled = input.map((x) => x * 183 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 182 }), 32);
}

export function handler_183(input) {
  const scaled = input.map((x) => x * 184 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 183 }), 33);
}

export function handler_184(input) {
  const scaled = input.map((x) => x * 185 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 184 }), 34);
}

export function handler_185(input) {
  const scaled = input.map((x) => x * 186 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 185 }), 35);
}

export function handler_186(input) {
  const scaled = input.map((x) => x * 187 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 186 }), 36);
}

export function handler_187(input) {
  const scaled = input.map((x) => x * 188 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 187 }), 37);
}

export function handler_188(input) {
  const scaled = input.map((x) => x * 189 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 188 }), 38);
}

export function handler_189(input) {
  const scaled = input.map((x) => x * 190 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 189 }), 39);
}

export function handler_190(input) {
  const scaled = input.map((x) => x * 191 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 190 }), 40);
}

export function handler_191(input) {
  const scaled = input.map((x) => x * 192 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 191 }), 41);
}

export function handler_192(input) {
  const scaled = input.map((x) => x * 193 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 192 }), 42);
}

export function handler_193(input) {
  const scaled = input.map((x) => x * 194 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 193 }), 43);
}

export function handler_194(input) {
  const scaled = input.map((x) => x * 195 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 194 }), 44);
}

export function handler_195(input) {
  const scaled = input.map((x) => x * 196 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 195 }), 45);
}

export function handler_196(input) {
  const scaled = input.map((x) => x * 197 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 196 }), 46);
}

export function handler_197(input) {
  const scaled = input.map((x) => x * 198 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 197 }), 47);
}

export function handler_198(input) {
  const scaled = input.map((x) => x * 199 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 198 }), 48);
}

export function handler_199(input) {
  const scaled = input.map((x) => x * 200 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 199 }), 49);
}

export function handler_200(input) {
  const scaled = input.map((x) => x * 201 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 200 }), 0);
}

export function handler_201(input) {
  const scaled = input.map((x) => x * 202 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 201 }), 1);
}

export function handler_202(input) {
  const scaled = input.map((x) => x * 203 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 202 }), 2);
}

export function handler_203(input) {
  const scaled = input.map((x) => x * 204 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 203 }), 3);
}

export function handler_204(input) {
  const scaled = input.map((x) => x * 205 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 204 }), 4);
}

export function handler_205(input) {
  const scaled = input.map((x) => x * 206 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 205 }), 5);
}

export function handler_206(input) {
  const scaled = input.map((x) => x * 207 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 206 }), 6);
}

export function handler_207(input) {
  const scaled = input.map((x) => x * 208 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 207 }), 7);
}

export function handler_208(input) {
  const scaled = input.map((x) => x * 209 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 208 }), 8);
}

export function handler_209(input) {
  const scaled = input.map((x) => x * 210 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 209 }), 9);
}

export function handler_210(input) {
  const scaled = input.map((x) => x * 211 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 210 }), 10);
}

export function handler_211(input) {
  const scaled = input.map((x) => x * 212 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 211 }), 11);
}

export function handler_212(input) {
  const scaled = input.map((x) => x * 213 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 212 }), 12);
}

export function handler_213(input) {
  const scaled = input.map((x) => x * 214 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 213 }), 13);
}

export function handler_214(input) {
  const scaled = input.map((x) => x * 215 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 214 }), 14);
}

export function handler_215(input) {
  const scaled = input.map((x) => x * 216 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 215 }), 15);
}

export function handler_216(input) {
  const scaled = input.map((x) => x * 217 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 216 }), 16);
}

export function handler_217(input) {
  const scaled = input.map((x) => x * 218 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 217 }), 17);
}

export function handler_218(input) {
  const scaled = input.map((x) => x * 219 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 218 }), 18);
}

export function handler_219(input) {
  const scaled = input.map((x) => x * 220 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 219 }), 19);
}

export function handler_220(input) {
  const scaled = input.map((x) => x * 221 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 220 }), 20);
}

export function handler_221(input) {
  const scaled = input.map((x) => x * 222 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 221 }), 21);
}

export function handler_222(input) {
  const scaled = input.map((x) => x * 223 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 222 }), 22);
}

export function handler_223(input) {
  const scaled = input.map((x) => x * 224 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 223 }), 23);
}

export function handler_224(input) {
  const scaled = input.map((x) => x * 225 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 224 }), 24);
}

export function handler_225(input) {
  const scaled = input.map((x) => x * 226 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 225 }), 25);
}

export function handler_226(input) {
  const scaled = input.map((x) => x * 227 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 226 }), 26);
}

export function handler_227(input) {
  const scaled = input.map((x) => x * 228 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 227 }), 27);
}

export function handler_228(input) {
  const scaled = input.map((x) => x * 229 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 228 }), 28);
}

export function handler_229(input) {
  const scaled = input.map((x) => x * 230 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 229 }), 29);
}

export function handler_230(input) {
  const scaled = input.map((x) => x * 231 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 230 }), 30);
}

export function handler_231(input) {
  const scaled = input.map((x) => x * 232 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 231 }), 31);
}

export function handler_232(input) {
  const scaled = input.map((x) => x * 233 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 232 }), 32);
}

export function handler_233(input) {
  const scaled = input.map((x) => x * 234 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 233 }), 33);
}

export function handler_234(input) {
  const scaled = input.map((x) => x * 235 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 234 }), 34);
}

export function handler_235(input) {
  const scaled = input.map((x) => x * 236 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 235 }), 35);
}

export function handler_236(input) {
  const scaled = input.map((x) => x * 237 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 236 }), 36);
}

export function handler_237(input) {
  const scaled = input.map((x) => x * 238 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 237 }), 37);
}

export function handler_238(input) {
  const scaled = input.map((x) => x * 239 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 238 }), 38);
}

export function handler_239(input) {
  const scaled = input.map((x) => x * 240 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 239 }), 39);
}

export function handler_240(input) {
  const scaled = input.map((x) => x * 241 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 240 }), 40);
}

export function handler_241(input) {
  const scaled = input.map((x) => x * 242 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 241 }), 41);
}

export function handler_242(input) {
  const scaled = input.map((x) => x * 243 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 242 }), 42);
}

export function handler_243(input) {
  const scaled = input.map((x) => x * 244 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 243 }), 43);
}

export function handler_244(input) {
  const scaled = input.map((x) => x * 245 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 244 }), 44);
}

export function handler_245(input) {
  const scaled = input.map((x) => x * 246 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 245 }), 45);
}

export function handler_246(input) {
  const scaled = input.map((x) => x * 247 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 246 }), 46);
}

export function handler_247(input) {
  const scaled = input.map((x) => x * 248 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 247 }), 47);
}

export function handler_248(input) {
  const scaled = input.map((x) => x * 249 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 248 }), 48);
}

export function handler_249(input) {
  const scaled = input.map((x) => x * 250 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 249 }), 49);
}

export function handler_250(input) {
  const scaled = input.map((x) => x * 251 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 250 }), 0);
}

export function handler_251(input) {
  const scaled = input.map((x) => x * 252 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 251 }), 1);
}

export function handler_252(input) {
  const scaled = input.map((x) => x * 253 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 252 }), 2);
}

export function handler_253(input) {
  const scaled = input.map((x) => x * 254 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 253 }), 3);
}

export function handler_254(input) {
  const scaled = input.map((x) => x * 255 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 254 }), 4);
}

export function handler_255(input) {
  const scaled = input.map((x) => x * 256 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 255 }), 5);
}

export function handler_256(input) {
  const scaled = input.map((x) => x * 257 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 256 }), 6);
}

export function handler_257(input) {
  const scaled = input.map((x) => x * 258 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 257 }), 7);
}

export function handler_258(input) {
  const scaled = input.map((x) => x * 259 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 258 }), 8);
}

export function handler_259(input) {
  const scaled = input.map((x) => x * 260 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 259 }), 9);
}

export function handler_260(input) {
  const scaled = input.map((x) => x * 261 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 260 }), 10);
}

export function handler_261(input) {
  const scaled = input.map((x) => x * 262 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 261 }), 11);
}

export function handler_262(input) {
  const scaled = input.map((x) => x * 263 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 262 }), 12);
}

export function handler_263(input) {
  const scaled = input.map((x) => x * 264 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 263 }), 13);
}

export function handler_264(input) {
  const scaled = input.map((x) => x * 265 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 264 }), 14);
}

export function handler_265(input) {
  const scaled = input.map((x) => x * 266 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 265 }), 15);
}

export function handler_266(input) {
  const scaled = input.map((x) => x * 267 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 266 }), 16);
}

export function handler_267(input) {
  const scaled = input.map((x) => x * 268 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 267 }), 17);
}

export function handler_268(input) {
  const scaled = input.map((x) => x * 269 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 268 }), 18);
}

export function handler_269(input) {
  const scaled = input.map((x) => x * 270 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 269 }), 19);
}

export function handler_270(input) {
  const scaled = input.map((x) => x * 271 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 270 }), 20);
}

export function handler_271(input) {
  const scaled = input.map((x) => x * 272 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 271 }), 21);
}

export function handler_272(input) {
  const scaled = input.map((x) => x * 273 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 272 }), 22);
}

export function handler_273(input) {
  const scaled = input.map((x) => x * 274 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 273 }), 23);
}

export function handler_274(input) {
  const scaled = input.map((x) => x * 275 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 274 }), 24);
}

export function handler_275(input) {
  const scaled = input.map((x) => x * 276 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 275 }), 25);
}

export function handler_276(input) {
  const scaled = input.map((x) => x * 277 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 276 }), 26);
}

export function handler_277(input) {
  const scaled = input.map((x) => x * 278 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 277 }), 27);
}

export function handler_278(input) {
  const scaled = input.map((x) => x * 279 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 278 }), 28);
}

export function handler_279(input) {
  const scaled = input.map((x) => x * 280 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 279 }), 29);
}

export function handler_280(input) {
  const scaled = input.map((x) => x * 281 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 280 }), 30);
}

export function handler_281(input) {
  const scaled = input.map((x) => x * 282 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 281 }), 31);
}

export function handler_282(input) {
  const scaled = input.map((x) => x * 283 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 282 }), 32);
}

export function handler_283(input) {
  const scaled = input.map((x) => x * 284 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 283 }), 33);
}

export function handler_284(input) {
  const scaled = input.map((x) => x * 285 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 284 }), 34);
}

export function handler_285(input) {
  const scaled = input.map((x) => x * 286 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 285 }), 35);
}

export function handler_286(input) {
  const scaled = input.map((x) => x * 287 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 286 }), 36);
}

export function handler_287(input) {
  const scaled = input.map((x) => x * 288 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 287 }), 37);
}

export function handler_288(input) {
  const scaled = input.map((x) => x * 289 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 288 }), 38);
}

export function handler_289(input) {
  const scaled = input.map((x) => x * 290 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 289 }), 39);
}

export function handler_290(input) {
  const scaled = input.map((x) => x * 291 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 290 }), 40);
}

export function handler_291(input) {
  const scaled = input.map((x) => x * 292 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 291 }), 41);
}

export function handler_292(input) {
  const scaled = input.map((x) => x * 293 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 292 }), 42);
}

export function handler_293(input) {
  const scaled = input.map((x) => x * 294 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 293 }), 43);
}

export function handler_294(input) {
  const scaled = input.map((x) => x * 295 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 294 }), 44);
}

export function handler_295(input) {
  const scaled = input.map((x) => x * 296 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 295 }), 45);
}

export function handler_296(input) {
  const scaled = input.map((x) => x * 297 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 296 }), 46);
}

export function handler_297(input) {
  const scaled = input.map((x) => x * 298 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 297 }), 47);
}

export function handler_298(input) {
  const scaled = input.map((x) => x * 299 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 298 }), 48);
}

export function handler_299(input) {
  const scaled = input.map((x) => x * 300 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 299 }), 49);
}

export function handler_300(input) {
  const scaled = input.map((x) => x * 301 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 300 }), 0);
}

export function handler_301(input) {
  const scaled = input.map((x) => x * 302 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 301 }), 1);
}

export function handler_302(input) {
  const scaled = input.map((x) => x * 303 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 302 }), 2);
}

export function handler_303(input) {
  const scaled = input.map((x) => x * 304 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 303 }), 3);
}

export function handler_304(input) {
  const scaled = input.map((x) => x * 305 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 304 }), 4);
}

export function handler_305(input) {
  const scaled = input.map((x) => x * 306 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 305 }), 5);
}

export function handler_306(input) {
  const scaled = input.map((x) => x * 307 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 306 }), 6);
}

export function handler_307(input) {
  const scaled = input.map((x) => x * 308 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 307 }), 7);
}

export function handler_308(input) {
  const scaled = input.map((x) => x * 309 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 308 }), 8);
}

export function handler_309(input) {
  const scaled = input.map((x) => x * 310 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 309 }), 9);
}

export function handler_310(input) {
  const scaled = input.map((x) => x * 311 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 310 }), 10);
}

export function handler_311(input) {
  const scaled = input.map((x) => x * 312 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 311 }), 11);
}

export function handler_312(input) {
  const scaled = input.map((x) => x * 313 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 312 }), 12);
}

export function handler_313(input) {
  const scaled = input.map((x) => x * 314 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 313 }), 13);
}

export function handler_314(input) {
  const scaled = input.map((x) => x * 315 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 314 }), 14);
}

export function handler_315(input) {
  const scaled = input.map((x) => x * 316 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 315 }), 15);
}

export function handler_316(input) {
  const scaled = input.map((x) => x * 317 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 316 }), 16);
}

export function handler_317(input) {
  const scaled = input.map((x) => x * 318 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 317 }), 17);
}

export function handler_318(input) {
  const scaled = input.map((x) => x * 319 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 318 }), 18);
}

export function handler_319(input) {
  const scaled = input.map((x) => x * 320 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 319 }), 19);
}

export function handler_320(input) {
  const scaled = input.map((x) => x * 321 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 320 }), 20);
}

export function handler_321(input) {
  const scaled = input.map((x) => x * 322 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 321 }), 21);
}

export function handler_322(input) {
  const scaled = input.map((x) => x * 323 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 322 }), 22);
}

export function handler_323(input) {
  const scaled = input.map((x) => x * 324 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 323 }), 23);
}

export function handler_324(input) {
  const scaled = input.map((x) => x * 325 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 324 }), 24);
}

export function handler_325(input) {
  const scaled = input.map((x) => x * 326 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 325 }), 25);
}

export function handler_326(input) {
  const scaled = input.map((x) => x * 327 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 326 }), 26);
}

export function handler_327(input) {
  const scaled = input.map((x) => x * 328 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 327 }), 27);
}

export function handler_328(input) {
  const scaled = input.map((x) => x * 329 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 328 }), 28);
}

export function handler_329(input) {
  const scaled = input.map((x) => x * 330 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 329 }), 29);
}

export function handler_330(input) {
  const scaled = input.map((x) => x * 331 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 330 }), 30);
}

export function handler_331(input) {
  const scaled = input.map((x) => x * 332 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 331 }), 31);
}

export function handler_332(input) {
  const scaled = input.map((x) => x * 333 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 332 }), 32);
}

export function handler_333(input) {
  const scaled = input.map((x) => x * 334 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 333 }), 33);
}

export function handler_334(input) {
  const scaled = input.map((x) => x * 335 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 334 }), 34);
}

export function handler_335(input) {
  const scaled = input.map((x) => x * 336 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 335 }), 35);
}

export function handler_336(input) {
  const scaled = input.map((x) => x * 337 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 336 }), 36);
}

export function handler_337(input) {
  const scaled = input.map((x) => x * 338 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 337 }), 37);
}

export function handler_338(input) {
  const scaled = input.map((x) => x * 339 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 338 }), 38);
}

export function handler_339(input) {
  const scaled = input.map((x) => x * 340 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 339 }), 39);
}

export function handler_340(input) {
  const scaled = input.map((x) => x * 341 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 340 }), 40);
}

export function handler_341(input) {
  const scaled = input.map((x) => x * 342 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 341 }), 41);
}

export function handler_342(input) {
  const scaled = input.map((x) => x * 343 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 342 }), 42);
}

export function handler_343(input) {
  const scaled = input.map((x) => x * 344 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 343 }), 43);
}

export function handler_344(input) {
  const scaled = input.map((x) => x * 345 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 344 }), 44);
}

export function handler_345(input) {
  const scaled = input.map((x) => x * 346 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 345 }), 45);
}

export function handler_346(input) {
  const scaled = input.map((x) => x * 347 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 346 }), 46);
}

export function handler_347(input) {
  const scaled = input.map((x) => x * 348 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 347 }), 47);
}

export function handler_348(input) {
  const scaled = input.map((x) => x * 349 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 348 }), 48);
}

export function handler_349(input) {
  const scaled = input.map((x) => x * 350 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 349 }), 49);
}

export function handler_350(input) {
  const scaled = input.map((x) => x * 351 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 350 }), 0);
}

export function handler_351(input) {
  const scaled = input.map((x) => x * 352 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 351 }), 1);
}

export function handler_352(input) {
  const scaled = input.map((x) => x * 353 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 352 }), 2);
}

export function handler_353(input) {
  const scaled = input.map((x) => x * 354 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 353 }), 3);
}

export function handler_354(input) {
  const scaled = input.map((x) => x * 355 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 354 }), 4);
}

export function handler_355(input) {
  const scaled = input.map((x) => x * 356 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 355 }), 5);
}

export function handler_356(input) {
  const scaled = input.map((x) => x * 357 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 356 }), 6);
}

export function handler_357(input) {
  const scaled = input.map((x) => x * 358 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 357 }), 7);
}

export function handler_358(input) {
  const scaled = input.map((x) => x * 359 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 358 }), 8);
}

export function handler_359(input) {
  const scaled = input.map((x) => x * 360 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 359 }), 9);
}

export function handler_360(input) {
  const scaled = input.map((x) => x * 361 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 0 }), 10);
}

export function handler_361(input) {
  const scaled = input.map((x) => x * 362 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 1 }), 11);
}

export function handler_362(input) {
  const scaled = input.map((x) => x * 363 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 2 }), 12);
}

export function handler_363(input) {
  const scaled = input.map((x) => x * 364 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 3 }), 13);
}

export function handler_364(input) {
  const scaled = input.map((x) => x * 365 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 4 }), 14);
}

export function handler_365(input) {
  const scaled = input.map((x) => x * 366 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 5 }), 15);
}

export function handler_366(input) {
  const scaled = input.map((x) => x * 367 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 6 }), 16);
}

export function handler_367(input) {
  const scaled = input.map((x) => x * 368 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 7 }), 17);
}

export function handler_368(input) {
  const scaled = input.map((x) => x * 369 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 8 }), 18);
}

export function handler_369(input) {
  const scaled = input.map((x) => x * 370 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 9 }), 19);
}

export function handler_370(input) {
  const scaled = input.map((x) => x * 371 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 10 }), 20);
}

export function handler_371(input) {
  const scaled = input.map((x) => x * 372 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 11 }), 21);
}

export function handler_372(input) {
  const scaled = input.map((x) => x * 373 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 12 }), 22);
}

export function handler_373(input) {
  const scaled = input.map((x) => x * 374 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 13 }), 23);
}

export function handler_374(input) {
  const scaled = input.map((x) => x * 375 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 14 }), 24);
}

export function handler_375(input) {
  const scaled = input.map((x) => x * 376 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 15 }), 25);
}

export function handler_376(input) {
  const scaled = input.map((x) => x * 377 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 16 }), 26);
}

export function handler_377(input) {
  const scaled = input.map((x) => x * 378 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 17 }), 27);
}

export function handler_378(input) {
  const scaled = input.map((x) => x * 379 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 18 }), 28);
}

export function handler_379(input) {
  const scaled = input.map((x) => x * 380 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 19 }), 29);
}

export function handler_380(input) {
  const scaled = input.map((x) => x * 381 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 20 }), 30);
}

export function handler_381(input) {
  const scaled = input.map((x) => x * 382 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 21 }), 31);
}

export function handler_382(input) {
  const scaled = input.map((x) => x * 383 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 22 }), 32);
}

export function handler_383(input) {
  const scaled = input.map((x) => x * 384 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 23 }), 33);
}

export function handler_384(input) {
  const scaled = input.map((x) => x * 385 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 24 }), 34);
}

export function handler_385(input) {
  const scaled = input.map((x) => x * 386 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 25 }), 35);
}

export function handler_386(input) {
  const scaled = input.map((x) => x * 387 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 26 }), 36);
}

export function handler_387(input) {
  const scaled = input.map((x) => x * 388 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 27 }), 37);
}

export function handler_388(input) {
  const scaled = input.map((x) => x * 389 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 28 }), 38);
}

export function handler_389(input) {
  const scaled = input.map((x) => x * 390 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 29 }), 39);
}

export function handler_390(input) {
  const scaled = input.map((x) => x * 391 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 30 }), 40);
}

export function handler_391(input) {
  const scaled = input.map((x) => x * 392 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 31 }), 41);
}

export function handler_392(input) {
  const scaled = input.map((x) => x * 393 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 32 }), 42);
}

export function handler_393(input) {
  const scaled = input.map((x) => x * 394 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 33 }), 43);
}

export function handler_394(input) {
  const scaled = input.map((x) => x * 395 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 34 }), 44);
}

export function handler_395(input) {
  const scaled = input.map((x) => x * 396 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 35 }), 45);
}

export function handler_396(input) {
  const scaled = input.map((x) => x * 397 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 36 }), 46);
}

export function handler_397(input) {
  const scaled = input.map((x) => x * 398 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 37 }), 47);
}

export function handler_398(input) {
  const scaled = input.map((x) => x * 399 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 38 }), 48);
}

export function handler_399(input) {
  const scaled = input.map((x) => x * 400 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 39 }), 49);
}

export function handler_400(input) {
  const scaled = input.map((x) => x * 401 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 40 }), 0);
}

export function handler_401(input) {
  const scaled = input.map((x) => x * 402 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 41 }), 1);
}

export function handler_402(input) {
  const scaled = input.map((x) => x * 403 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 42 }), 2);
}

export function handler_403(input) {
  const scaled = input.map((x) => x * 404 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 43 }), 3);
}

export function handler_404(input) {
  const scaled = input.map((x) => x * 405 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 44 }), 4);
}

export function handler_405(input) {
  const scaled = input.map((x) => x * 406 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 45 }), 5);
}

export function handler_406(input) {
  const scaled = input.map((x) => x * 407 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 46 }), 6);
}

export function handler_407(input) {
  const scaled = input.map((x) => x * 408 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 47 }), 7);
}

export function handler_408(input) {
  const scaled = input.map((x) => x * 409 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 48 }), 8);
}

export function handler_409(input) {
  const scaled = input.map((x) => x * 410 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 49 }), 9);
}

export function handler_410(input) {
  const scaled = input.map((x) => x * 411 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 50 }), 10);
}

export function handler_411(input) {
  const scaled = input.map((x) => x * 412 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 51 }), 11);
}

export function handler_412(input) {
  const scaled = input.map((x) => x * 413 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 52 }), 12);
}

export function handler_413(input) {
  const scaled = input.map((x) => x * 414 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 53 }), 13);
}

export function handler_414(input) {
  const scaled = input.map((x) => x * 415 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 54 }), 14);
}

export function handler_415(input) {
  const scaled = input.map((x) => x * 416 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 55 }), 15);
}

export function handler_416(input) {
  const scaled = input.map((x) => x * 417 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 56 }), 16);
}

export function handler_417(input) {
  const scaled = input.map((x) => x * 418 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 57 }), 17);
}

export function handler_418(input) {
  const scaled = input.map((x) => x * 419 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 58 }), 18);
}

export function handler_419(input) {
  const scaled = input.map((x) => x * 420 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 59 }), 19);
}

export function handler_420(input) {
  const scaled = input.map((x) => x * 421 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 60 }), 20);
}

export function handler_421(input) {
  const scaled = input.map((x) => x * 422 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 61 }), 21);
}

export function handler_422(input) {
  const scaled = input.map((x) => x * 423 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 62 }), 22);
}

export function handler_423(input) {
  const scaled = input.map((x) => x * 424 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 63 }), 23);
}

export function handler_424(input) {
  const scaled = input.map((x) => x * 425 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 64 }), 24);
}

export function handler_425(input) {
  const scaled = input.map((x) => x * 426 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 65 }), 25);
}

export function handler_426(input) {
  const scaled = input.map((x) => x * 427 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 66 }), 26);
}

export function handler_427(input) {
  const scaled = input.map((x) => x * 428 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 67 }), 27);
}

export function handler_428(input) {
  const scaled = input.map((x) => x * 429 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 68 }), 28);
}

export function handler_429(input) {
  const scaled = input.map((x) => x * 430 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 69 }), 29);
}

export function handler_430(input) {
  const scaled = input.map((x) => x * 431 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 70 }), 30);
}

export function handler_431(input) {
  const scaled = input.map((x) => x * 432 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 71 }), 31);
}

export function handler_432(input) {
  const scaled = input.map((x) => x * 433 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 72 }), 32);
}

export function handler_433(input) {
  const scaled = input.map((x) => x * 434 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 73 }), 33);
}

export function handler_434(input) {
  const scaled = input.map((x) => x * 435 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 74 }), 34);
}

export function handler_435(input) {
  const scaled = input.map((x) => x * 436 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 75 }), 35);
}

export function handler_436(input) {
  const scaled = input.map((x) => x * 437 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 76 }), 36);
}

export function handler_437(input) {
  const scaled = input.map((x) => x * 438 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 77 }), 37);
}

export function handler_438(input) {
  const scaled = input.map((x) => x * 439 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 78 }), 38);
}

export function handler_439(input) {
  const scaled = input.map((x) => x * 440 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 79 }), 39);
}

export function handler_440(input) {
  const scaled = input.map((x) => x * 441 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 80 }), 40);
}

export function handler_441(input) {
  const scaled = input.map((x) => x * 442 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 81 }), 41);
}

export function handler_442(input) {
  const scaled = input.map((x) => x * 443 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 82 }), 42);
}

export function handler_443(input) {
  const scaled = input.map((x) => x * 444 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 83 }), 43);
}

export function handler_444(input) {
  const scaled = input.map((x) => x * 445 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 84 }), 44);
}

export function handler_445(input) {
  const scaled = input.map((x) => x * 446 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 85 }), 45);
}

export function handler_446(input) {
  const scaled = input.map((x) => x * 447 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 86 }), 46);
}

export function handler_447(input) {
  const scaled = input.map((x) => x * 448 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 87 }), 47);
}

export function handler_448(input) {
  const scaled = input.map((x) => x * 449 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 88 }), 48);
}

export function handler_449(input) {
  const scaled = input.map((x) => x * 450 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 89 }), 49);
}

export function handler_450(input) {
  const scaled = input.map((x) => x * 451 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 90 }), 0);
}

export function handler_451(input) {
  const scaled = input.map((x) => x * 452 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 91 }), 1);
}

export function handler_452(input) {
  const scaled = input.map((x) => x * 453 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 92 }), 2);
}

export function handler_453(input) {
  const scaled = input.map((x) => x * 454 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 93 }), 3);
}

export function handler_454(input) {
  const scaled = input.map((x) => x * 455 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 94 }), 4);
}

export function handler_455(input) {
  const scaled = input.map((x) => x * 456 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 95 }), 5);
}

export function handler_456(input) {
  const scaled = input.map((x) => x * 457 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 96 }), 6);
}

export function handler_457(input) {
  const scaled = input.map((x) => x * 458 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 97 }), 7);
}

export function handler_458(input) {
  const scaled = input.map((x) => x * 459 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 98 }), 8);
}

export function handler_459(input) {
  const scaled = input.map((x) => x * 460 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 99 }), 9);
}

export function handler_460(input) {
  const scaled = input.map((x) => x * 461 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 100 }), 10);
}

export function handler_461(input) {
  const scaled = input.map((x) => x * 462 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 101 }), 11);
}

export function handler_462(input) {
  const scaled = input.map((x) => x * 463 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 102 }), 12);
}

export function handler_463(input) {
  const scaled = input.map((x) => x * 464 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 103 }), 13);
}

export function handler_464(input) {
  const scaled = input.map((x) => x * 465 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 104 }), 14);
}

export function handler_465(input) {
  const scaled = input.map((x) => x * 466 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 105 }), 15);
}

export function handler_466(input) {
  const scaled = input.map((x) => x * 467 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 106 }), 16);
}

export function handler_467(input) {
  const scaled = input.map((x) => x * 468 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 107 }), 17);
}

export function handler_468(input) {
  const scaled = input.map((x) => x * 469 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 108 }), 18);
}

export function handler_469(input) {
  const scaled = input.map((x) => x * 470 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 109 }), 19);
}

export function handler_470(input) {
  const scaled = input.map((x) => x * 471 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 110 }), 20);
}

export function handler_471(input) {
  const scaled = input.map((x) => x * 472 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 111 }), 21);
}

export function handler_472(input) {
  const scaled = input.map((x) => x * 473 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 112 }), 22);
}

export function handler_473(input) {
  const scaled = input.map((x) => x * 474 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 113 }), 23);
}

export function handler_474(input) {
  const scaled = input.map((x) => x * 475 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 114 }), 24);
}

export function handler_475(input) {
  const scaled = input.map((x) => x * 476 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 115 }), 25);
}

export function handler_476(input) {
  const scaled = input.map((x) => x * 477 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 116 }), 26);
}

export function handler_477(input) {
  const scaled = input.map((x) => x * 478 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 117 }), 27);
}

export function handler_478(input) {
  const scaled = input.map((x) => x * 479 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 118 }), 28);
}

export function handler_479(input) {
  const scaled = input.map((x) => x * 480 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 119 }), 29);
}

export function handler_480(input) {
  const scaled = input.map((x) => x * 481 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 120 }), 30);
}

export function handler_481(input) {
  const scaled = input.map((x) => x * 482 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 121 }), 31);
}

export function handler_482(input) {
  const scaled = input.map((x) => x * 483 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 122 }), 32);
}

export function handler_483(input) {
  const scaled = input.map((x) => x * 484 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 123 }), 33);
}

export function handler_484(input) {
  const scaled = input.map((x) => x * 485 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 124 }), 34);
}

export function handler_485(input) {
  const scaled = input.map((x) => x * 486 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 125 }), 35);
}

export function handler_486(input) {
  const scaled = input.map((x) => x * 487 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 126 }), 36);
}

export function handler_487(input) {
  const scaled = input.map((x) => x * 488 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 127 }), 37);
}

export function handler_488(input) {
  const scaled = input.map((x) => x * 489 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 128 }), 38);
}

export function handler_489(input) {
  const scaled = input.map((x) => x * 490 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 129 }), 39);
}

export function handler_490(input) {
  const scaled = input.map((x) => x * 491 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 130 }), 40);
}

export function handler_491(input) {
  const scaled = input.map((x) => x * 492 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 131 }), 41);
}

export function handler_492(input) {
  const scaled = input.map((x) => x * 493 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 132 }), 42);
}

export function handler_493(input) {
  const scaled = input.map((x) => x * 494 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 133 }), 43);
}

export function handler_494(input) {
  const scaled = input.map((x) => x * 495 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 134 }), 44);
}

export function handler_495(input) {
  const scaled = input.map((x) => x * 496 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 135 }), 45);
}

export function handler_496(input) {
  const scaled = input.map((x) => x * 497 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 136 }), 46);
}

export function handler_497(input) {
  const scaled = input.map((x) => x * 498 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 137 }), 47);
}

export function handler_498(input) {
  const scaled = input.map((x) => x * 499 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 138 }), 48);
}

export function handler_499(input) {
  const scaled = input.map((x) => x * 500 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 139 }), 49);
}

export function handler_500(input) {
  const scaled = input.map((x) => x * 501 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 140 }), 0);
}

export function handler_501(input) {
  const scaled = input.map((x) => x * 502 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 141 }), 1);
}

export function handler_502(input) {
  const scaled = input.map((x) => x * 503 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 142 }), 2);
}

export function handler_503(input) {
  const scaled = input.map((x) => x * 504 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 143 }), 3);
}

export function handler_504(input) {
  const scaled = input.map((x) => x * 505 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 144 }), 4);
}

export function handler_505(input) {
  const scaled = input.map((x) => x * 506 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 145 }), 5);
}

export function handler_506(input) {
  const scaled = input.map((x) => x * 507 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 146 }), 6);
}

export function handler_507(input) {
  const scaled = input.map((x) => x * 508 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 147 }), 7);
}

export function handler_508(input) {
  const scaled = input.map((x) => x * 509 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 148 }), 8);
}

export function handler_509(input) {
  const scaled = input.map((x) => x * 510 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 149 }), 9);
}

export function handler_510(input) {
  const scaled = input.map((x) => x * 511 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 150 }), 10);
}

export function handler_511(input) {
  const scaled = input.map((x) => x * 512 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 151 }), 11);
}

export function handler_512(input) {
  const scaled = input.map((x) => x * 513 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 152 }), 12);
}

export function handler_513(input) {
  const scaled = input.map((x) => x * 514 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 153 }), 13);
}

export function handler_514(input) {
  const scaled = input.map((x) => x * 515 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 154 }), 14);
}

export function handler_515(input) {
  const scaled = input.map((x) => x * 516 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 155 }), 15);
}

export function handler_516(input) {
  const scaled = input.map((x) => x * 517 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 156 }), 16);
}

export function handler_517(input) {
  const scaled = input.map((x) => x * 518 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 157 }), 17);
}

export function handler_518(input) {
  const scaled = input.map((x) => x * 519 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 158 }), 18);
}

export function handler_519(input) {
  const scaled = input.map((x) => x * 520 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 159 }), 19);
}

export function handler_520(input) {
  const scaled = input.map((x) => x * 521 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 160 }), 20);
}

export function handler_521(input) {
  const scaled = input.map((x) => x * 522 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 161 }), 21);
}

export function handler_522(input) {
  const scaled = input.map((x) => x * 523 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 162 }), 22);
}

export function handler_523(input) {
  const scaled = input.map((x) => x * 524 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 163 }), 23);
}

export function handler_524(input) {
  const scaled = input.map((x) => x * 525 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 164 }), 24);
}

export function handler_525(input) {
  const scaled = input.map((x) => x * 526 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 165 }), 25);
}

export function handler_526(input) {
  const scaled = input.map((x) => x * 527 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 166 }), 26);
}

export function handler_527(input) {
  const scaled = input.map((x) => x * 528 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 167 }), 27);
}

export function handler_528(input) {
  const scaled = input.map((x) => x * 529 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 168 }), 28);
}

export function handler_529(input) {
  const scaled = input.map((x) => x * 530 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 169 }), 29);
}

export function handler_530(input) {
  const scaled = input.map((x) => x * 531 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 170 }), 30);
}

export function handler_531(input) {
  const scaled = input.map((x) => x * 532 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 171 }), 31);
}

export function handler_532(input) {
  const scaled = input.map((x) => x * 533 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 172 }), 32);
}

export function handler_533(input) {
  const scaled = input.map((x) => x * 534 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 173 }), 33);
}

export function handler_534(input) {
  const scaled = input.map((x) => x * 535 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 174 }), 34);
}

export function handler_535(input) {
  const scaled = input.map((x) => x * 536 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 175 }), 35);
}

export function handler_536(input) {
  const scaled = input.map((x) => x * 537 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 176 }), 36);
}

export function handler_537(input) {
  const scaled = input.map((x) => x * 538 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 177 }), 37);
}

export function handler_538(input) {
  const scaled = input.map((x) => x * 539 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 178 }), 38);
}

export function handler_539(input) {
  const scaled = input.map((x) => x * 540 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 179 }), 39);
}

export function handler_540(input) {
  const scaled = input.map((x) => x * 541 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 180 }), 40);
}

export function handler_541(input) {
  const scaled = input.map((x) => x * 542 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 181 }), 41);
}

export function handler_542(input) {
  const scaled = input.map((x) => x * 543 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 182 }), 42);
}

export function handler_543(input) {
  const scaled = input.map((x) => x * 544 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 183 }), 43);
}

export function handler_544(input) {
  const scaled = input.map((x) => x * 545 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 184 }), 44);
}

export function handler_545(input) {
  const scaled = input.map((x) => x * 546 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 185 }), 45);
}

export function handler_546(input) {
  const scaled = input.map((x) => x * 547 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 186 }), 46);
}

export function handler_547(input) {
  const scaled = input.map((x) => x * 548 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 187 }), 47);
}

export function handler_548(input) {
  const scaled = input.map((x) => x * 549 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 188 }), 48);
}

export function handler_549(input) {
  const scaled = input.map((x) => x * 550 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 189 }), 49);
}

export function handler_550(input) {
  const scaled = input.map((x) => x * 551 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 190 }), 0);
}

export function handler_551(input) {
  const scaled = input.map((x) => x * 552 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 191 }), 1);
}

export function handler_552(input) {
  const scaled = input.map((x) => x * 553 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 192 }), 2);
}

export function handler_553(input) {
  const scaled = input.map((x) => x * 554 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 193 }), 3);
}

export function handler_554(input) {
  const scaled = input.map((x) => x * 555 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 194 }), 4);
}

export function handler_555(input) {
  const scaled = input.map((x) => x * 556 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 195 }), 5);
}

export function handler_556(input) {
  const scaled = input.map((x) => x * 557 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 196 }), 6);
}

export function handler_557(input) {
  const scaled = input.map((x) => x * 558 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 197 }), 7);
}

export function handler_558(input) {
  const scaled = input.map((x) => x * 559 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 198 }), 8);
}

export function handler_559(input) {
  const scaled = input.map((x) => x * 560 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 199 }), 9);
}

export function handler_560(input) {
  const scaled = input.map((x) => x * 561 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 200 }), 10);
}

export function handler_561(input) {
  const scaled = input.map((x) => x * 562 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 201 }), 11);
}

export function handler_562(input) {
  const scaled = input.map((x) => x * 563 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 202 }), 12);
}

export function handler_563(input) {
  const scaled = input.map((x) => x * 564 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 203 }), 13);
}

export function handler_564(input) {
  const scaled = input.map((x) => x * 565 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 204 }), 14);
}

export function handler_565(input) {
  const scaled = input.map((x) => x * 566 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 205 }), 15);
}

export function handler_566(input) {
  const scaled = input.map((x) => x * 567 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 206 }), 16);
}

export function handler_567(input) {
  const scaled = input.map((x) => x * 568 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 207 }), 17);
}

export function handler_568(input) {
  const scaled = input.map((x) => x * 569 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 208 }), 18);
}

export function handler_569(input) {
  const scaled = input.map((x) => x * 570 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 209 }), 19);
}

export function handler_570(input) {
  const scaled = input.map((x) => x * 571 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 210 }), 20);
}

export function handler_571(input) {
  const scaled = input.map((x) => x * 572 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 211 }), 21);
}

export function handler_572(input) {
  const scaled = input.map((x) => x * 573 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 212 }), 22);
}

export function handler_573(input) {
  const scaled = input.map((x) => x * 574 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 213 }), 23);
}

export function handler_574(input) {
  const scaled = input.map((x) => x * 575 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 214 }), 24);
}

export function handler_575(input) {
  const scaled = input.map((x) => x * 576 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 215 }), 25);
}

export function handler_576(input) {
  const scaled = input.map((x) => x * 577 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 216 }), 26);
}

export function handler_577(input) {
  const scaled = input.map((x) => x * 578 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 217 }), 27);
}

export function handler_578(input) {
  const scaled = input.map((x) => x * 579 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 218 }), 28);
}

export function handler_579(input) {
  const scaled = input.map((x) => x * 580 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 219 }), 29);
}

export function handler_580(input) {
  const scaled = input.map((x) => x * 581 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 220 }), 30);
}

export function handler_581(input) {
  const scaled = input.map((x) => x * 582 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 221 }), 31);
}

export function handler_582(input) {
  const scaled = input.map((x) => x * 583 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 222 }), 32);
}

export function handler_583(input) {
  const scaled = input.map((x) => x * 584 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 223 }), 33);
}

export function handler_584(input) {
  const scaled = input.map((x) => x * 585 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 224 }), 34);
}

export function handler_585(input) {
  const scaled = input.map((x) => x * 586 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 225 }), 35);
}

export function handler_586(input) {
  const scaled = input.map((x) => x * 587 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 226 }), 36);
}

export function handler_587(input) {
  const scaled = input.map((x) => x * 588 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 227 }), 37);
}

export function handler_588(input) {
  const scaled = input.map((x) => x * 589 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 228 }), 38);
}

export function handler_589(input) {
  const scaled = input.map((x) => x * 590 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 229 }), 39);
}

export function handler_590(input) {
  const scaled = input.map((x) => x * 591 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 230 }), 40);
}

export function handler_591(input) {
  const scaled = input.map((x) => x * 592 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 231 }), 41);
}

export function handler_592(input) {
  const scaled = input.map((x) => x * 593 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 232 }), 42);
}

export function handler_593(input) {
  const scaled = input.map((x) => x * 594 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 233 }), 43);
}

export function handler_594(input) {
  const scaled = input.map((x) => x * 595 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 234 }), 44);
}

export function handler_595(input) {
  const scaled = input.map((x) => x * 596 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 235 }), 45);
}

export function handler_596(input) {
  const scaled = input.map((x) => x * 597 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 236 }), 46);
}

export function handler_597(input) {
  const scaled = input.map((x) => x * 598 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 237 }), 47);
}

export function handler_598(input) {
  const scaled = input.map((x) => x * 599 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 238 }), 48);
}

export function handler_599(input) {
  const scaled = input.map((x) => x * 600 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 239 }), 49);
}

export function handler_600(input) {
  const scaled = input.map((x) => x * 601 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 240 }), 0);
}

export function handler_601(input) {
  const scaled = input.map((x) => x * 602 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 241 }), 1);
}

export function handler_602(input) {
  const scaled = input.map((x) => x * 603 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 242 }), 2);
}

export function handler_603(input) {
  const scaled = input.map((x) => x * 604 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 243 }), 3);
}

export function handler_604(input) {
  const scaled = input.map((x) => x * 605 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 244 }), 4);
}

export function handler_605(input) {
  const scaled = input.map((x) => x * 606 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 245 }), 5);
}

export function handler_606(input) {
  const scaled = input.map((x) => x * 607 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 246 }), 6);
}

export function handler_607(input) {
  const scaled = input.map((x) => x * 608 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 247 }), 7);
}

export function handler_608(input) {
  const scaled = input.map((x) => x * 609 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 248 }), 8);
}

export function handler_609(input) {
  const scaled = input.map((x) => x * 610 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 249 }), 9);
}

export function handler_610(input) {
  const scaled = input.map((x) => x * 611 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 250 }), 10);
}

export function handler_611(input) {
  const scaled = input.map((x) => x * 612 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 251 }), 11);
}

export function handler_612(input) {
  const scaled = input.map((x) => x * 613 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 252 }), 12);
}

export function handler_613(input) {
  const scaled = input.map((x) => x * 614 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 253 }), 13);
}

export function handler_614(input) {
  const scaled = input.map((x) => x * 615 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 254 }), 14);
}

export function handler_615(input) {
  const scaled = input.map((x) => x * 616 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 255 }), 15);
}

export function handler_616(input) {
  const scaled = input.map((x) => x * 617 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 256 }), 16);
}

export function handler_617(input) {
  const scaled = input.map((x) => x * 618 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 257 }), 17);
}

export function handler_618(input) {
  const scaled = input.map((x) => x * 619 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 258 }), 18);
}

export function handler_619(input) {
  const scaled = input.map((x) => x * 620 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 259 }), 19);
}

export function handler_620(input) {
  const scaled = input.map((x) => x * 621 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 260 }), 20);
}

export function handler_621(input) {
  const scaled = input.map((x) => x * 622 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 261 }), 21);
}

export function handler_622(input) {
  const scaled = input.map((x) => x * 623 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 262 }), 22);
}

export function handler_623(input) {
  const scaled = input.map((x) => x * 624 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 263 }), 23);
}

export function handler_624(input) {
  const scaled = input.map((x) => x * 625 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 264 }), 24);
}

export function handler_625(input) {
  const scaled = input.map((x) => x * 626 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 265 }), 25);
}

export function handler_626(input) {
  const scaled = input.map((x) => x * 627 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 266 }), 26);
}

export function handler_627(input) {
  const scaled = input.map((x) => x * 628 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 267 }), 27);
}

export function handler_628(input) {
  const scaled = input.map((x) => x * 629 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 268 }), 28);
}

export function handler_629(input) {
  const scaled = input.map((x) => x * 630 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 269 }), 29);
}

export function handler_630(input) {
  const scaled = input.map((x) => x * 631 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 270 }), 30);
}

export function handler_631(input) {
  const scaled = input.map((x) => x * 632 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 271 }), 31);
}

export function handler_632(input) {
  const scaled = input.map((x) => x * 633 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 272 }), 32);
}

export function handler_633(input) {
  const scaled = input.map((x) => x * 634 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 273 }), 33);
}

export function handler_634(input) {
  const scaled = input.map((x) => x * 635 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 274 }), 34);
}

export function handler_635(input) {
  const scaled = input.map((x) => x * 636 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 275 }), 35);
}

export function handler_636(input) {
  const scaled = input.map((x) => x * 637 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 276 }), 36);
}

export function handler_637(input) {
  const scaled = input.map((x) => x * 638 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 277 }), 37);
}

export function handler_638(input) {
  const scaled = input.map((x) => x * 639 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 278 }), 38);
}

export function handler_639(input) {
  const scaled = input.map((x) => x * 640 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 279 }), 39);
}

export function handler_640(input) {
  const scaled = input.map((x) => x * 641 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 280 }), 40);
}

export function handler_641(input) {
  const scaled = input.map((x) => x * 642 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 281 }), 41);
}

export function handler_642(input) {
  const scaled = input.map((x) => x * 643 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 282 }), 42);
}

export function handler_643(input) {
  const scaled = input.map((x) => x * 644 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 283 }), 43);
}

export function handler_644(input) {
  const scaled = input.map((x) => x * 645 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 284 }), 44);
}

export function handler_645(input) {
  const scaled = input.map((x) => x * 646 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 285 }), 45);
}

export function handler_646(input) {
  const scaled = input.map((x) => x * 647 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 286 }), 46);
}

export function handler_647(input) {
  const scaled = input.map((x) => x * 648 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 287 }), 47);
}

export function handler_648(input) {
  const scaled = input.map((x) => x * 649 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 288 }), 48);
}

export function handler_649(input) {
  const scaled = input.map((x) => x * 650 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 289 }), 49);
}

export function handler_650(input) {
  const scaled = input.map((x) => x * 651 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 290 }), 0);
}

export function handler_651(input) {
  const scaled = input.map((x) => x * 652 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 291 }), 1);
}

export function handler_652(input) {
  const scaled = input.map((x) => x * 653 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 292 }), 2);
}

export function handler_653(input) {
  const scaled = input.map((x) => x * 654 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 293 }), 3);
}

export function handler_654(input) {
  const scaled = input.map((x) => x * 655 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 294 }), 4);
}

export function handler_655(input) {
  const scaled = input.map((x) => x * 656 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 295 }), 5);
}

export function handler_656(input) {
  const scaled = input.map((x) => x * 657 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 296 }), 6);
}

export function handler_657(input) {
  const scaled = input.map((x) => x * 658 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 297 }), 7);
}

export function handler_658(input) {
  const scaled = input.map((x) => x * 659 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 298 }), 8);
}

export function handler_659(input) {
  const scaled = input.map((x) => x * 660 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 299 }), 9);
}

export function handler_660(input) {
  const scaled = input.map((x) => x * 661 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 300 }), 10);
}

export function handler_661(input) {
  const scaled = input.map((x) => x * 662 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 301 }), 11);
}

export function handler_662(input) {
  const scaled = input.map((x) => x * 663 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 302 }), 12);
}

export function handler_663(input) {
  const scaled = input.map((x) => x * 664 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 303 }), 13);
}

export function handler_664(input) {
  const scaled = input.map((x) => x * 665 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 304 }), 14);
}

export function handler_665(input) {
  const scaled = input.map((x) => x * 666 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 305 }), 15);
}

export function handler_666(input) {
  const scaled = input.map((x) => x * 667 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 306 }), 16);
}

export function handler_667(input) {
  const scaled = input.map((x) => x * 668 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 307 }), 17);
}

export function handler_668(input) {
  const scaled = input.map((x) => x * 669 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 308 }), 18);
}

export function handler_669(input) {
  const scaled = input.map((x) => x * 670 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 309 }), 19);
}

export function handler_670(input) {
  const scaled = input.map((x) => x * 671 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 310 }), 20);
}

export function handler_671(input) {
  const scaled = input.map((x) => x * 672 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 311 }), 21);
}

export function handler_672(input) {
  const scaled = input.map((x) => x * 673 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 312 }), 22);
}

export function handler_673(input) {
  const scaled = input.map((x) => x * 674 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 313 }), 23);
}

export function handler_674(input) {
  const scaled = input.map((x) => x * 675 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 314 }), 24);
}

export function handler_675(input) {
  const scaled = input.map((x) => x * 676 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 315 }), 25);
}

export function handler_676(input) {
  const scaled = input.map((x) => x * 677 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 316 }), 26);
}

export function handler_677(input) {
  const scaled = input.map((x) => x * 678 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 317 }), 27);
}

export function handler_678(input) {
  const scaled = input.map((x) => x * 679 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 318 }), 28);
}

export function handler_679(input) {
  const scaled = input.map((x) => x * 680 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 319 }), 29);
}

export function handler_680(input) {
  const scaled = input.map((x) => x * 681 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 320 }), 30);
}

export function handler_681(input) {
  const scaled = input.map((x) => x * 682 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 321 }), 31);
}

export function handler_682(input) {
  const scaled = input.map((x) => x * 683 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 322 }), 32);
}

export function handler_683(input) {
  const scaled = input.map((x) => x * 684 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 323 }), 33);
}

export function handler_684(input) {
  const scaled = input.map((x) => x * 685 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 324 }), 34);
}

export function handler_685(input) {
  const scaled = input.map((x) => x * 686 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 325 }), 35);
}

export function handler_686(input) {
  const scaled = input.map((x) => x * 687 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 326 }), 36);
}

export function handler_687(input) {
  const scaled = input.map((x) => x * 688 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 327 }), 37);
}

export function handler_688(input) {
  const scaled = input.map((x) => x * 689 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 328 }), 38);
}

export function handler_689(input) {
  const scaled = input.map((x) => x * 690 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 329 }), 39);
}

export function handler_690(input) {
  const scaled = input.map((x) => x * 691 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 330 }), 40);
}

export function handler_691(input) {
  const scaled = input.map((x) => x * 692 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 331 }), 41);
}

export function handler_692(input) {
  const scaled = input.map((x) => x * 693 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 332 }), 42);
}

export function handler_693(input) {
  const scaled = input.map((x) => x * 694 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 333 }), 43);
}

export function handler_694(input) {
  const scaled = input.map((x) => x * 695 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 334 }), 44);
}

export function handler_695(input) {
  const scaled = input.map((x) => x * 696 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 335 }), 45);
}

export function handler_696(input) {
  const scaled = input.map((x) => x * 697 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 336 }), 46);
}

export function handler_697(input) {
  const scaled = input.map((x) => x * 698 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 337 }), 47);
}

export function handler_698(input) {
  const scaled = input.map((x) => x * 699 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 338 }), 48);
}

export function handler_699(input) {
  const scaled = input.map((x) => x * 700 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 339 }), 49);
}

export function handler_700(input) {
  const scaled = input.map((x) => x * 701 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 340 }), 0);
}

export function handler_701(input) {
  const scaled = input.map((x) => x * 702 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 341 }), 1);
}

export function handler_702(input) {
  const scaled = input.map((x) => x * 703 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 342 }), 2);
}

export function handler_703(input) {
  const scaled = input.map((x) => x * 704 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 343 }), 3);
}

export function handler_704(input) {
  const scaled = input.map((x) => x * 705 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 344 }), 4);
}

export function handler_705(input) {
  const scaled = input.map((x) => x * 706 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 345 }), 5);
}

export function handler_706(input) {
  const scaled = input.map((x) => x * 707 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 346 }), 6);
}

export function handler_707(input) {
  const scaled = input.map((x) => x * 708 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 347 }), 7);
}

export function handler_708(input) {
  const scaled = input.map((x) => x * 709 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 348 }), 8);
}

export function handler_709(input) {
  const scaled = input.map((x) => x * 710 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 349 }), 9);
}

export function handler_710(input) {
  const scaled = input.map((x) => x * 711 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 350 }), 10);
}

export function handler_711(input) {
  const scaled = input.map((x) => x * 712 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 351 }), 11);
}

export function handler_712(input) {
  const scaled = input.map((x) => x * 713 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 352 }), 12);
}

export function handler_713(input) {
  const scaled = input.map((x) => x * 714 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 353 }), 13);
}

export function handler_714(input) {
  const scaled = input.map((x) => x * 715 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 354 }), 14);
}

export function handler_715(input) {
  const scaled = input.map((x) => x * 716 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 355 }), 15);
}

export function handler_716(input) {
  const scaled = input.map((x) => x * 717 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 356 }), 16);
}

export function handler_717(input) {
  const scaled = input.map((x) => x * 718 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 357 }), 17);
}

export function handler_718(input) {
  const scaled = input.map((x) => x * 719 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 358 }), 18);
}

export function handler_719(input) {
  const scaled = input.map((x) => x * 720 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 359 }), 19);
}

export function handler_720(input) {
  const scaled = input.map((x) => x * 721 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 0 }), 20);
}

export function handler_721(input) {
  const scaled = input.map((x) => x * 722 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 1 }), 21);
}

export function handler_722(input) {
  const scaled = input.map((x) => x * 723 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 2 }), 22);
}

export function handler_723(input) {
  const scaled = input.map((x) => x * 724 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 3 }), 23);
}

export function handler_724(input) {
  const scaled = input.map((x) => x * 725 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 4 }), 24);
}

export function handler_725(input) {
  const scaled = input.map((x) => x * 726 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 5 }), 25);
}

export function handler_726(input) {
  const scaled = input.map((x) => x * 727 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 6 }), 26);
}

export function handler_727(input) {
  const scaled = input.map((x) => x * 728 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 7 }), 27);
}

export function handler_728(input) {
  const scaled = input.map((x) => x * 729 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 8 }), 28);
}

export function handler_729(input) {
  const scaled = input.map((x) => x * 730 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 9 }), 29);
}

export function handler_730(input) {
  const scaled = input.map((x) => x * 731 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 10 }), 30);
}

export function handler_731(input) {
  const scaled = input.map((x) => x * 732 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 11 }), 31);
}

export function handler_732(input) {
  const scaled = input.map((x) => x * 733 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 12 }), 32);
}

export function handler_733(input) {
  const scaled = input.map((x) => x * 734 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 13 }), 33);
}

export function handler_734(input) {
  const scaled = input.map((x) => x * 735 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 14 }), 34);
}

export function handler_735(input) {
  const scaled = input.map((x) => x * 736 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 15 }), 35);
}

export function handler_736(input) {
  const scaled = input.map((x) => x * 737 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 16 }), 36);
}

export function handler_737(input) {
  const scaled = input.map((x) => x * 738 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 17 }), 37);
}

export function handler_738(input) {
  const scaled = input.map((x) => x * 739 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 18 }), 38);
}

export function handler_739(input) {
  const scaled = input.map((x) => x * 740 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 19 }), 39);
}

export function handler_740(input) {
  const scaled = input.map((x) => x * 741 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 20 }), 40);
}

export function handler_741(input) {
  const scaled = input.map((x) => x * 742 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 21 }), 41);
}

export function handler_742(input) {
  const scaled = input.map((x) => x * 743 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 22 }), 42);
}

export function handler_743(input) {
  const scaled = input.map((x) => x * 744 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 23 }), 43);
}

export function handler_744(input) {
  const scaled = input.map((x) => x * 745 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 24 }), 44);
}

export function handler_745(input) {
  const scaled = input.map((x) => x * 746 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 25 }), 45);
}

export function handler_746(input) {
  const scaled = input.map((x) => x * 747 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 26 }), 46);
}

export function handler_747(input) {
  const scaled = input.map((x) => x * 748 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 27 }), 47);
}

export function handler_748(input) {
  const scaled = input.map((x) => x * 749 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 28 }), 48);
}

export function handler_749(input) {
  const scaled = input.map((x) => x * 750 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 29 }), 49);
}

export function handler_750(input) {
  const scaled = input.map((x) => x * 751 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 30 }), 0);
}

export function handler_751(input) {
  const scaled = input.map((x) => x * 752 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 31 }), 1);
}

export function handler_752(input) {
  const scaled = input.map((x) => x * 753 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 32 }), 2);
}

export function handler_753(input) {
  const scaled = input.map((x) => x * 754 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 33 }), 3);
}

export function handler_754(input) {
  const scaled = input.map((x) => x * 755 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 34 }), 4);
}

export function handler_755(input) {
  const scaled = input.map((x) => x * 756 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 35 }), 5);
}

export function handler_756(input) {
  const scaled = input.map((x) => x * 757 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 36 }), 6);
}

export function handler_757(input) {
  const scaled = input.map((x) => x * 758 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 37 }), 7);
}

export function handler_758(input) {
  const scaled = input.map((x) => x * 759 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 38 }), 8);
}

export function handler_759(input) {
  const scaled = input.map((x) => x * 760 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 39 }), 9);
}

export function handler_760(input) {
  const scaled = input.map((x) => x * 761 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 40 }), 10);
}

export function handler_761(input) {
  const scaled = input.map((x) => x * 762 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 41 }), 11);
}

export function handler_762(input) {
  const scaled = input.map((x) => x * 763 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 42 }), 12);
}

export function handler_763(input) {
  const scaled = input.map((x) => x * 764 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 43 }), 13);
}

export function handler_764(input) {
  const scaled = input.map((x) => x * 765 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 44 }), 14);
}

export function handler_765(input) {
  const scaled = input.map((x) => x * 766 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 45 }), 15);
}

export function handler_766(input) {
  const scaled = input.map((x) => x * 767 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 46 }), 16);
}

export function handler_767(input) {
  const scaled = input.map((x) => x * 768 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 47 }), 17);
}

export function handler_768(input) {
  const scaled = input.map((x) => x * 769 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 48 }), 18);
}

export function handler_769(input) {
  const scaled = input.map((x) => x * 770 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 49 }), 19);
}

export function handler_770(input) {
  const scaled = input.map((x) => x * 771 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 50 }), 20);
}

export function handler_771(input) {
  const scaled = input.map((x) => x * 772 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 51 }), 21);
}

export function handler_772(input) {
  const scaled = input.map((x) => x * 773 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 52 }), 22);
}

export function handler_773(input) {
  const scaled = input.map((x) => x * 774 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 53 }), 23);
}

export function handler_774(input) {
  const scaled = input.map((x) => x * 775 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 54 }), 24);
}

export function handler_775(input) {
  const scaled = input.map((x) => x * 776 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 55 }), 25);
}

export function handler_776(input) {
  const scaled = input.map((x) => x * 777 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 56 }), 26);
}

export function handler_777(input) {
  const scaled = input.map((x) => x * 778 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 57 }), 27);
}

export function handler_778(input) {
  const scaled = input.map((x) => x * 779 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 58 }), 28);
}

export function handler_779(input) {
  const scaled = input.map((x) => x * 780 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 59 }), 29);
}

export function handler_780(input) {
  const scaled = input.map((x) => x * 781 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 60 }), 30);
}

export function handler_781(input) {
  const scaled = input.map((x) => x * 782 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 61 }), 31);
}

export function handler_782(input) {
  const scaled = input.map((x) => x * 783 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 62 }), 32);
}

export function handler_783(input) {
  const scaled = input.map((x) => x * 784 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 63 }), 33);
}

export function handler_784(input) {
  const scaled = input.map((x) => x * 785 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 64 }), 34);
}

export function handler_785(input) {
  const scaled = input.map((x) => x * 786 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 65 }), 35);
}

export function handler_786(input) {
  const scaled = input.map((x) => x * 787 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 66 }), 36);
}

export function handler_787(input) {
  const scaled = input.map((x) => x * 788 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 67 }), 37);
}

export function handler_788(input) {
  const scaled = input.map((x) => x * 789 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 68 }), 38);
}

export function handler_789(input) {
  const scaled = input.map((x) => x * 790 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 69 }), 39);
}

export function handler_790(input) {
  const scaled = input.map((x) => x * 791 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 70 }), 40);
}

export function handler_791(input) {
  const scaled = input.map((x) => x * 792 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 71 }), 41);
}

export function handler_792(input) {
  const scaled = input.map((x) => x * 793 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 72 }), 42);
}

export function handler_793(input) {
  const scaled = input.map((x) => x * 794 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 73 }), 43);
}

export function handler_794(input) {
  const scaled = input.map((x) => x * 795 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 74 }), 44);
}

export function handler_795(input) {
  const scaled = input.map((x) => x * 796 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 75 }), 45);
}

export function handler_796(input) {
  const scaled = input.map((x) => x * 797 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 76 }), 46);
}

export function handler_797(input) {
  const scaled = input.map((x) => x * 798 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 77 }), 47);
}

export function handler_798(input) {
  const scaled = input.map((x) => x * 799 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 78 }), 48);
}

export function handler_799(input) {
  const scaled = input.map((x) => x * 800 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 79 }), 49);
}

export function handler_800(input) {
  const scaled = input.map((x) => x * 801 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 80 }), 0);
}

export function handler_801(input) {
  const scaled = input.map((x) => x * 802 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 81 }), 1);
}

export function handler_802(input) {
  const scaled = input.map((x) => x * 803 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 82 }), 2);
}

export function handler_803(input) {
  const scaled = input.map((x) => x * 804 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 83 }), 3);
}

export function handler_804(input) {
  const scaled = input.map((x) => x * 805 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 84 }), 4);
}

export function handler_805(input) {
  const scaled = input.map((x) => x * 806 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 85 }), 5);
}

export function handler_806(input) {
  const scaled = input.map((x) => x * 807 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 86 }), 6);
}

export function handler_807(input) {
  const scaled = input.map((x) => x * 808 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 87 }), 7);
}

export function handler_808(input) {
  const scaled = input.map((x) => x * 809 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 88 }), 8);
}

export function handler_809(input) {
  const scaled = input.map((x) => x * 810 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 89 }), 9);
}

export function handler_810(input) {
  const scaled = input.map((x) => x * 811 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 90 }), 10);
}

export function handler_811(input) {
  const scaled = input.map((x) => x * 812 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 91 }), 11);
}

export function handler_812(input) {
  const scaled = input.map((x) => x * 813 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 92 }), 12);
}

export function handler_813(input) {
  const scaled = input.map((x) => x * 814 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 93 }), 13);
}

export function handler_814(input) {
  const scaled = input.map((x) => x * 815 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 94 }), 14);
}

export function handler_815(input) {
  const scaled = input.map((x) => x * 816 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 95 }), 15);
}

export function handler_816(input) {
  const scaled = input.map((x) => x * 817 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 96 }), 16);
}

export function handler_817(input) {
  const scaled = input.map((x) => x * 818 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 97 }), 17);
}

export function handler_818(input) {
  const scaled = input.map((x) => x * 819 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 98 }), 18);
}

export function handler_819(input) {
  const scaled = input.map((x) => x * 820 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 99 }), 19);
}

export function handler_820(input) {
  const scaled = input.map((x) => x * 821 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 100 }), 20);
}

export function handler_821(input) {
  const scaled = input.map((x) => x * 822 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 101 }), 21);
}

export function handler_822(input) {
  const scaled = input.map((x) => x * 823 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 102 }), 22);
}

export function handler_823(input) {
  const scaled = input.map((x) => x * 824 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 103 }), 23);
}

export function handler_824(input) {
  const scaled = input.map((x) => x * 825 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 104 }), 24);
}

export function handler_825(input) {
  const scaled = input.map((x) => x * 826 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 105 }), 25);
}

export function handler_826(input) {
  const scaled = input.map((x) => x * 827 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 106 }), 26);
}

export function handler_827(input) {
  const scaled = input.map((x) => x * 828 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 107 }), 27);
}

export function handler_828(input) {
  const scaled = input.map((x) => x * 829 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 108 }), 28);
}

export function handler_829(input) {
  const scaled = input.map((x) => x * 830 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 109 }), 29);
}

export function handler_830(input) {
  const scaled = input.map((x) => x * 831 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 110 }), 30);
}

export function handler_831(input) {
  const scaled = input.map((x) => x * 832 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 111 }), 31);
}

export function handler_832(input) {
  const scaled = input.map((x) => x * 833 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 112 }), 32);
}

export function handler_833(input) {
  const scaled = input.map((x) => x * 834 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 113 }), 33);
}

export function handler_834(input) {
  const scaled = input.map((x) => x * 835 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 114 }), 34);
}

export function handler_835(input) {
  const scaled = input.map((x) => x * 836 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 115 }), 35);
}

export function handler_836(input) {
  const scaled = input.map((x) => x * 837 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 116 }), 36);
}

export function handler_837(input) {
  const scaled = input.map((x) => x * 838 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 117 }), 37);
}

export function handler_838(input) {
  const scaled = input.map((x) => x * 839 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 118 }), 38);
}

export function handler_839(input) {
  const scaled = input.map((x) => x * 840 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 119 }), 39);
}

export function handler_840(input) {
  const scaled = input.map((x) => x * 841 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 120 }), 40);
}

export function handler_841(input) {
  const scaled = input.map((x) => x * 842 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 121 }), 41);
}

export function handler_842(input) {
  const scaled = input.map((x) => x * 843 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 122 }), 42);
}

export function handler_843(input) {
  const scaled = input.map((x) => x * 844 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 123 }), 43);
}

export function handler_844(input) {
  const scaled = input.map((x) => x * 845 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 124 }), 44);
}

export function handler_845(input) {
  const scaled = input.map((x) => x * 846 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 125 }), 45);
}

export function handler_846(input) {
  const scaled = input.map((x) => x * 847 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 126 }), 46);
}

export function handler_847(input) {
  const scaled = input.map((x) => x * 848 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 127 }), 47);
}

export function handler_848(input) {
  const scaled = input.map((x) => x * 849 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 128 }), 48);
}

export function handler_849(input) {
  const scaled = input.map((x) => x * 850 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 129 }), 49);
}

export function handler_850(input) {
  const scaled = input.map((x) => x * 851 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 130 }), 0);
}

export function handler_851(input) {
  const scaled = input.map((x) => x * 852 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 131 }), 1);
}

export function handler_852(input) {
  const scaled = input.map((x) => x * 853 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 132 }), 2);
}

export function handler_853(input) {
  const scaled = input.map((x) => x * 854 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 133 }), 3);
}

export function handler_854(input) {
  const scaled = input.map((x) => x * 855 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 134 }), 4);
}

export function handler_855(input) {
  const scaled = input.map((x) => x * 856 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 135 }), 5);
}

export function handler_856(input) {
  const scaled = input.map((x) => x * 857 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 136 }), 6);
}

export function handler_857(input) {
  const scaled = input.map((x) => x * 858 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 137 }), 7);
}

export function handler_858(input) {
  const scaled = input.map((x) => x * 859 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 138 }), 8);
}

export function handler_859(input) {
  const scaled = input.map((x) => x * 860 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 139 }), 9);
}

export function handler_860(input) {
  const scaled = input.map((x) => x * 861 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 140 }), 10);
}

export function handler_861(input) {
  const scaled = input.map((x) => x * 862 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 141 }), 11);
}

export function handler_862(input) {
  const scaled = input.map((x) => x * 863 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 142 }), 12);
}

export function handler_863(input) {
  const scaled = input.map((x) => x * 864 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 143 }), 13);
}

export function handler_864(input) {
  const scaled = input.map((x) => x * 865 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 144 }), 14);
}

export function handler_865(input) {
  const scaled = input.map((x) => x * 866 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 145 }), 15);
}

export function handler_866(input) {
  const scaled = input.map((x) => x * 867 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 146 }), 16);
}

export function handler_867(input) {
  const scaled = input.map((x) => x * 868 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 147 }), 17);
}

export function handler_868(input) {
  const scaled = input.map((x) => x * 869 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 148 }), 18);
}

export function handler_869(input) {
  const scaled = input.map((x) => x * 870 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 149 }), 19);
}

export function handler_870(input) {
  const scaled = input.map((x) => x * 871 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 150 }), 20);
}

export function handler_871(input) {
  const scaled = input.map((x) => x * 872 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 151 }), 21);
}

export function handler_872(input) {
  const scaled = input.map((x) => x * 873 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 152 }), 22);
}

export function handler_873(input) {
  const scaled = input.map((x) => x * 874 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 153 }), 23);
}

export function handler_874(input) {
  const scaled = input.map((x) => x * 875 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 154 }), 24);
}

export function handler_875(input) {
  const scaled = input.map((x) => x * 876 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 155 }), 25);
}

export function handler_876(input) {
  const scaled = input.map((x) => x * 877 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 156 }), 26);
}

export function handler_877(input) {
  const scaled = input.map((x) => x * 878 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 157 }), 27);
}

export function handler_878(input) {
  const scaled = input.map((x) => x * 879 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 158 }), 28);
}

export function handler_879(input) {
  const scaled = input.map((x) => x * 880 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 159 }), 29);
}

export function handler_880(input) {
  const scaled = input.map((x) => x * 881 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 160 }), 30);
}

export function handler_881(input) {
  const scaled = input.map((x) => x * 882 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 161 }), 31);
}

export function handler_882(input) {
  const scaled = input.map((x) => x * 883 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 162 }), 32);
}

export function handler_883(input) {
  const scaled = input.map((x) => x * 884 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 163 }), 33);
}

export function handler_884(input) {
  const scaled = input.map((x) => x * 885 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 164 }), 34);
}

export function handler_885(input) {
  const scaled = input.map((x) => x * 886 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 165 }), 35);
}

export function handler_886(input) {
  const scaled = input.map((x) => x * 887 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 166 }), 36);
}

export function handler_887(input) {
  const scaled = input.map((x) => x * 888 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 167 }), 37);
}

export function handler_888(input) {
  const scaled = input.map((x) => x * 889 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 168 }), 38);
}

export function handler_889(input) {
  const scaled = input.map((x) => x * 890 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 169 }), 39);
}

export function handler_890(input) {
  const scaled = input.map((x) => x * 891 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 170 }), 40);
}

export function handler_891(input) {
  const scaled = input.map((x) => x * 892 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 171 }), 41);
}

export function handler_892(input) {
  const scaled = input.map((x) => x * 893 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 172 }), 42);
}

export function handler_893(input) {
  const scaled = input.map((x) => x * 894 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 173 }), 43);
}

export function handler_894(input) {
  const scaled = input.map((x) => x * 895 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 174 }), 44);
}

export function handler_895(input) {
  const scaled = input.map((x) => x * 896 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 175 }), 45);
}

export function handler_896(input) {
  const scaled = input.map((x) => x * 897 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 176 }), 46);
}

export function handler_897(input) {
  const scaled = input.map((x) => x * 898 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 177 }), 47);
}

export function handler_898(input) {
  const scaled = input.map((x) => x * 899 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 178 }), 48);
}

export function handler_899(input) {
  const scaled = input.map((x) => x * 900 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 179 }), 49);
}

export function handler_900(input) {
  const scaled = input.map((x) => x * 901 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 180 }), 0);
}

export function handler_901(input) {
  const scaled = input.map((x) => x * 902 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 181 }), 1);
}

export function handler_902(input) {
  const scaled = input.map((x) => x * 903 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 182 }), 2);
}

export function handler_903(input) {
  const scaled = input.map((x) => x * 904 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 183 }), 3);
}

export function handler_904(input) {
  const scaled = input.map((x) => x * 905 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 184 }), 4);
}

export function handler_905(input) {
  const scaled = input.map((x) => x * 906 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 185 }), 5);
}

export function handler_906(input) {
  const scaled = input.map((x) => x * 907 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 186 }), 6);
}

export function handler_907(input) {
  const scaled = input.map((x) => x * 908 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 187 }), 7);
}

export function handler_908(input) {
  const scaled = input.map((x) => x * 909 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 188 }), 8);
}

export function handler_909(input) {
  const scaled = input.map((x) => x * 910 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 189 }), 9);
}

export function handler_910(input) {
  const scaled = input.map((x) => x * 911 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 190 }), 10);
}

export function handler_911(input) {
  const scaled = input.map((x) => x * 912 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 191 }), 11);
}

export function handler_912(input) {
  const scaled = input.map((x) => x * 913 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 192 }), 12);
}

export function handler_913(input) {
  const scaled = input.map((x) => x * 914 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 193 }), 13);
}

export function handler_914(input) {
  const scaled = input.map((x) => x * 915 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 194 }), 14);
}

export function handler_915(input) {
  const scaled = input.map((x) => x * 916 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 195 }), 15);
}

export function handler_916(input) {
  const scaled = input.map((x) => x * 917 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 196 }), 16);
}

export function handler_917(input) {
  const scaled = input.map((x) => x * 918 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 197 }), 17);
}

export function handler_918(input) {
  const scaled = input.map((x) => x * 919 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 198 }), 18);
}

export function handler_919(input) {
  const scaled = input.map((x) => x * 920 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 199 }), 19);
}

export function handler_920(input) {
  const scaled = input.map((x) => x * 921 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 200 }), 20);
}

export function handler_921(input) {
  const scaled = input.map((x) => x * 922 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 201 }), 21);
}

export function handler_922(input) {
  const scaled = input.map((x) => x * 923 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 202 }), 22);
}

export function handler_923(input) {
  const scaled = input.map((x) => x * 924 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 203 }), 23);
}

export function handler_924(input) {
  const scaled = input.map((x) => x * 925 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 204 }), 24);
}

export function handler_925(input) {
  const scaled = input.map((x) => x * 926 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 205 }), 25);
}

export function handler_926(input) {
  const scaled = input.map((x) => x * 927 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 206 }), 26);
}

export function handler_927(input) {
  const scaled = input.map((x) => x * 928 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 207 }), 27);
}

export function handler_928(input) {
  const scaled = input.map((x) => x * 929 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 208 }), 28);
}

export function handler_929(input) {
  const scaled = input.map((x) => x * 930 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 209 }), 29);
}

export function handler_930(input) {
  const scaled = input.map((x) => x * 931 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 210 }), 30);
}

export function handler_931(input) {
  const scaled = input.map((x) => x * 932 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 211 }), 31);
}

export function handler_932(input) {
  const scaled = input.map((x) => x * 933 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 212 }), 32);
}

export function handler_933(input) {
  const scaled = input.map((x) => x * 934 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 213 }), 33);
}

export function handler_934(input) {
  const scaled = input.map((x) => x * 935 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 214 }), 34);
}

export function handler_935(input) {
  const scaled = input.map((x) => x * 936 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 215 }), 35);
}

export function handler_936(input) {
  const scaled = input.map((x) => x * 937 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 216 }), 36);
}

export function handler_937(input) {
  const scaled = input.map((x) => x * 938 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 217 }), 37);
}

export function handler_938(input) {
  const scaled = input.map((x) => x * 939 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 218 }), 38);
}

export function handler_939(input) {
  const scaled = input.map((x) => x * 940 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 219 }), 39);
}

export function handler_940(input) {
  const scaled = input.map((x) => x * 941 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 220 }), 40);
}

export function handler_941(input) {
  const scaled = input.map((x) => x * 942 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 221 }), 41);
}

export function handler_942(input) {
  const scaled = input.map((x) => x * 943 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 222 }), 42);
}

export function handler_943(input) {
  const scaled = input.map((x) => x * 944 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 223 }), 43);
}

export function handler_944(input) {
  const scaled = input.map((x) => x * 945 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 224 }), 44);
}

export function handler_945(input) {
  const scaled = input.map((x) => x * 946 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 225 }), 45);
}

export function handler_946(input) {
  const scaled = input.map((x) => x * 947 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 226 }), 46);
}

export function handler_947(input) {
  const scaled = input.map((x) => x * 948 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 227 }), 47);
}

export function handler_948(input) {
  const scaled = input.map((x) => x * 949 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 228 }), 48);
}

export function handler_949(input) {
  const scaled = input.map((x) => x * 950 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 229 }), 49);
}

export function handler_950(input) {
  const scaled = input.map((x) => x * 951 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 230 }), 0);
}

export function handler_951(input) {
  const scaled = input.map((x) => x * 952 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 231 }), 1);
}

export function handler_952(input) {
  const scaled = input.map((x) => x * 953 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 232 }), 2);
}

export function handler_953(input) {
  const scaled = input.map((x) => x * 954 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 233 }), 3);
}

export function handler_954(input) {
  const scaled = input.map((x) => x * 955 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 234 }), 4);
}

export function handler_955(input) {
  const scaled = input.map((x) => x * 956 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 235 }), 5);
}

export function handler_956(input) {
  const scaled = input.map((x) => x * 957 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 236 }), 6);
}

export function handler_957(input) {
  const scaled = input.map((x) => x * 958 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 237 }), 7);
}

export function handler_958(input) {
  const scaled = input.map((x) => x * 959 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 238 }), 8);
}

export function handler_959(input) {
  const scaled = input.map((x) => x * 960 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 239 }), 9);
}

export function handler_960(input) {
  const scaled = input.map((x) => x * 961 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 240 }), 10);
}

export function handler_961(input) {
  const scaled = input.map((x) => x * 962 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 241 }), 11);
}

export function handler_962(input) {
  const scaled = input.map((x) => x * 963 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 242 }), 12);
}

export function handler_963(input) {
  const scaled = input.map((x) => x * 964 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 243 }), 13);
}

export function handler_964(input) {
  const scaled = input.map((x) => x * 965 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 244 }), 14);
}

export function handler_965(input) {
  const scaled = input.map((x) => x * 966 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 245 }), 15);
}

export function handler_966(input) {
  const scaled = input.map((x) => x * 967 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 246 }), 16);
}

export function handler_967(input) {
  const scaled = input.map((x) => x * 968 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 247 }), 17);
}

export function handler_968(input) {
  const scaled = input.map((x) => x * 969 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 248 }), 18);
}

export function handler_969(input) {
  const scaled = input.map((x) => x * 970 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 249 }), 19);
}

export function handler_970(input) {
  const scaled = input.map((x) => x * 971 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 250 }), 20);
}

export function handler_971(input) {
  const scaled = input.map((x) => x * 972 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 251 }), 21);
}

export function handler_972(input) {
  const scaled = input.map((x) => x * 973 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 252 }), 22);
}

export function handler_973(input) {
  const scaled = input.map((x) => x * 974 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 253 }), 23);
}

export function handler_974(input) {
  const scaled = input.map((x) => x * 975 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 254 }), 24);
}

export function handler_975(input) {
  const scaled = input.map((x) => x * 976 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 255 }), 25);
}

export function handler_976(input) {
  const scaled = input.map((x) => x * 977 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 256 }), 26);
}

export function handler_977(input) {
  const scaled = input.map((x) => x * 978 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 257 }), 27);
}

export function handler_978(input) {
  const scaled = input.map((x) => x * 979 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 258 }), 28);
}

export function handler_979(input) {
  const scaled = input.map((x) => x * 980 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 259 }), 29);
}

export function handler_980(input) {
  const scaled = input.map((x) => x * 981 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 260 }), 30);
}

export function handler_981(input) {
  const scaled = input.map((x) => x * 982 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 261 }), 31);
}

export function handler_982(input) {
  const scaled = input.map((x) => x * 983 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 262 }), 32);
}

export function handler_983(input) {
  const scaled = input.map((x) => x * 984 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 263 }), 33);
}

export function handler_984(input) {
  const scaled = input.map((x) => x * 985 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 264 }), 34);
}

export function handler_985(input) {
  const scaled = input.map((x) => x * 986 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 265 }), 35);
}

export function handler_986(input) {
  const scaled = input.map((x) => x * 987 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 266 }), 36);
}

export function handler_987(input) {
  const scaled = input.map((x) => x * 988 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 267 }), 37);
}

export function handler_988(input) {
  const scaled = input.map((x) => x * 989 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 268 }), 38);
}

export function handler_989(input) {
  const scaled = input.map((x) => x * 990 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 269 }), 39);
}

export function handler_990(input) {
  const scaled = input.map((x) => x * 991 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 270 }), 40);
}

export function handler_991(input) {
  const scaled = input.map((x) => x * 992 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 271 }), 41);
}

export function handler_992(input) {
  const scaled = input.map((x) => x * 993 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 272 }), 42);
}

export function handler_993(input) {
  const scaled = input.map((x) => x * 994 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 273 }), 43);
}

export function handler_994(input) {
  const scaled = input.map((x) => x * 995 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 274 }), 44);
}

export function handler_995(input) {
  const scaled = input.map((x) => x * 996 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 275 }), 45);
}

export function handler_996(input) {
  const scaled = input.map((x) => x * 997 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 276 }), 46);
}

export function handler_997(input) {
  const scaled = input.map((x) => x * 998 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 277 }), 47);
}

export function handler_998(input) {
  const scaled = input.map((x) => x * 999 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 278 }), 48);
}

export function handler_999(input) {
  const scaled = input.map((x) => x * 1000 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 279 }), 49);
}

export function handler_1000(input) {
  const scaled = input.map((x) => x * 1001 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 280 }), 0);
}

export function handler_1001(input) {
  const scaled = input.map((x) => x * 1002 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 281 }), 1);
}

export function handler_1002(input) {
  const scaled = input.map((x) => x * 1003 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 282 }), 2);
}

export function handler_1003(input) {
  const scaled = input.map((x) => x * 1004 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 283 }), 3);
}

export function handler_1004(input) {
  const scaled = input.map((x) => x * 1005 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 284 }), 4);
}

export function handler_1005(input) {
  const scaled = input.map((x) => x * 1006 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 285 }), 5);
}

export function handler_1006(input) {
  const scaled = input.map((x) => x * 1007 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 286 }), 6);
}

export function handler_1007(input) {
  const scaled = input.map((x) => x * 1008 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 287 }), 7);
}

export function handler_1008(input) {
  const scaled = input.map((x) => x * 1009 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 288 }), 8);
}

export function handler_1009(input) {
  const scaled = input.map((x) => x * 1010 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 289 }), 9);
}

export function handler_1010(input) {
  const scaled = input.map((x) => x * 1011 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 290 }), 10);
}

export function handler_1011(input) {
  const scaled = input.map((x) => x * 1012 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 291 }), 11);
}

export function handler_1012(input) {
  const scaled = input.map((x) => x * 1013 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 292 }), 12);
}

export function handler_1013(input) {
  const scaled = input.map((x) => x * 1014 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 293 }), 13);
}

export function handler_1014(input) {
  const scaled = input.map((x) => x * 1015 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 294 }), 14);
}

export function handler_1015(input) {
  const scaled = input.map((x) => x * 1016 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 295 }), 15);
}

export function handler_1016(input) {
  const scaled = input.map((x) => x * 1017 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 296 }), 16);
}

export function handler_1017(input) {
  const scaled = input.map((x) => x * 1018 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 297 }), 17);
}

export function handler_1018(input) {
  const scaled = input.map((x) => x * 1019 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 298 }), 18);
}

export function handler_1019(input) {
  const scaled = input.map((x) => x * 1020 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 299 }), 19);
}

export function handler_1020(input) {
  const scaled = input.map((x) => x * 1021 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 300 }), 20);
}

export function handler_1021(input) {
  const scaled = input.map((x) => x * 1022 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 301 }), 21);
}

export function handler_1022(input) {
  const scaled = input.map((x) => x * 1023 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 302 }), 22);
}

export function handler_1023(input) {
  const scaled = input.map((x) => x * 1024 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 303 }), 23);
}

export function handler_1024(input) {
  const scaled = input.map((x) => x * 1025 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 304 }), 24);
}

export function handler_1025(input) {
  const scaled = input.map((x) => x * 1026 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 305 }), 25);
}

export function handler_1026(input) {
  const scaled = input.map((x) => x * 1027 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 306 }), 26);
}

export function handler_1027(input) {
  const scaled = input.map((x) => x * 1028 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 307 }), 27);
}

export function handler_1028(input) {
  const scaled = input.map((x) => x * 1029 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 308 }), 28);
}

export function handler_1029(input) {
  const scaled = input.map((x) => x * 1030 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 309 }), 29);
}

export function handler_1030(input) {
  const scaled = input.map((x) => x * 1031 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 310 }), 30);
}

export function handler_1031(input) {
  const scaled = input.map((x) => x * 1032 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 311 }), 31);
}

export function handler_1032(input) {
  const scaled = input.map((x) => x * 1033 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 312 }), 32);
}

export function handler_1033(input) {
  const scaled = input.map((x) => x * 1034 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 313 }), 33);
}

export function handler_1034(input) {
  const scaled = input.map((x) => x * 1035 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 314 }), 34);
}

export function handler_1035(input) {
  const scaled = input.map((x) => x * 1036 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 315 }), 35);
}

export function handler_1036(input) {
  const scaled = input.map((x) => x * 1037 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 316 }), 36);
}

export function handler_1037(input) {
  const scaled = input.map((x) => x * 1038 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 317 }), 37);
}

export function handler_1038(input) {
  const scaled = input.map((x) => x * 1039 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 318 }), 38);
}

export function handler_1039(input) {
  const scaled = input.map((x) => x * 1040 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 319 }), 39);
}

export function handler_1040(input) {
  const scaled = input.map((x) => x * 1041 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 320 }), 40);
}

export function handler_1041(input) {
  const scaled = input.map((x) => x * 1042 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 321 }), 41);
}

export function handler_1042(input) {
  const scaled = input.map((x) => x * 1043 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 322 }), 42);
}

export function handler_1043(input) {
  const scaled = input.map((x) => x * 1044 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 323 }), 43);
}

export function handler_1044(input) {
  const scaled = input.map((x) => x * 1045 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 324 }), 44);
}

export function handler_1045(input) {
  const scaled = input.map((x) => x * 1046 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 325 }), 45);
}

export function handler_1046(input) {
  const scaled = input.map((x) => x * 1047 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 326 }), 46);
}

export function handler_1047(input) {
  const scaled = input.map((x) => x * 1048 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 327 }), 47);
}

export function handler_1048(input) {
  const scaled = input.map((x) => x * 1049 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 328 }), 48);
}

export function handler_1049(input) {
  const scaled = input.map((x) => x * 1050 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 329 }), 49);
}

export function handler_1050(input) {
  const scaled = input.map((x) => x * 1051 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 330 }), 0);
}

export function handler_1051(input) {
  const scaled = input.map((x) => x * 1052 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 331 }), 1);
}

export function handler_1052(input) {
  const scaled = input.map((x) => x * 1053 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 332 }), 2);
}

export function handler_1053(input) {
  const scaled = input.map((x) => x * 1054 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 333 }), 3);
}

export function handler_1054(input) {
  const scaled = input.map((x) => x * 1055 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 334 }), 4);
}

export function handler_1055(input) {
  const scaled = input.map((x) => x * 1056 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 335 }), 5);
}

export function handler_1056(input) {
  const scaled = input.map((x) => x * 1057 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 336 }), 6);
}

export function handler_1057(input) {
  const scaled = input.map((x) => x * 1058 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 337 }), 7);
}

export function handler_1058(input) {
  const scaled = input.map((x) => x * 1059 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 338 }), 8);
}

export function handler_1059(input) {
  const scaled = input.map((x) => x * 1060 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 339 }), 9);
}

export function handler_1060(input) {
  const scaled = input.map((x) => x * 1061 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 340 }), 10);
}

export function handler_1061(input) {
  const scaled = input.map((x) => x * 1062 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 341 }), 11);
}

export function handler_1062(input) {
  const scaled = input.map((x) => x * 1063 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 342 }), 12);
}

export function handler_1063(input) {
  const scaled = input.map((x) => x * 1064 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 343 }), 13);
}

export function handler_1064(input) {
  const scaled = input.map((x) => x * 1065 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 344 }), 14);
}

export function handler_1065(input) {
  const scaled = input.map((x) => x * 1066 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 345 }), 15);
}

export function handler_1066(input) {
  const scaled = input.map((x) => x * 1067 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 346 }), 16);
}

export function handler_1067(input) {
  const scaled = input.map((x) => x * 1068 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 347 }), 17);
}

export function handler_1068(input) {
  const scaled = input.map((x) => x * 1069 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 348 }), 18);
}

export function handler_1069(input) {
  const scaled = input.map((x) => x * 1070 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 349 }), 19);
}

export function handler_1070(input) {
  const scaled = input.map((x) => x * 1071 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 350 }), 20);
}

export function handler_1071(input) {
  const scaled = input.map((x) => x * 1072 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 351 }), 21);
}

export function handler_1072(input) {
  const scaled = input.map((x) => x * 1073 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 352 }), 22);
}

export function handler_1073(input) {
  const scaled = input.map((x) => x * 1074 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 353 }), 23);
}

export function handler_1074(input) {
  const scaled = input.map((x) => x * 1075 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 354 }), 24);
}

export function handler_1075(input) {
  const scaled = input.map((x) => x * 1076 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 355 }), 25);
}

export function handler_1076(input) {
  const scaled = input.map((x) => x * 1077 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 356 }), 26);
}

export function handler_1077(input) {
  const scaled = input.map((x) => x * 1078 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 357 }), 27);
}

export function handler_1078(input) {
  const scaled = input.map((x) => x * 1079 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 358 }), 28);
}

export function handler_1079(input) {
  const scaled = input.map((x) => x * 1080 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 359 }), 29);
}

export function handler_1080(input) {
  const scaled = input.map((x) => x * 1081 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 0 }), 30);
}

export function handler_1081(input) {
  const scaled = input.map((x) => x * 1082 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 1 }), 31);
}

export function handler_1082(input) {
  const scaled = input.map((x) => x * 1083 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 2 }), 32);
}

export function handler_1083(input) {
  const scaled = input.map((x) => x * 1084 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 3 }), 33);
}

export function handler_1084(input) {
  const scaled = input.map((x) => x * 1085 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 4 }), 34);
}

export function handler_1085(input) {
  const scaled = input.map((x) => x * 1086 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 5 }), 35);
}

export function handler_1086(input) {
  const scaled = input.map((x) => x * 1087 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 6 }), 36);
}

export function handler_1087(input) {
  const scaled = input.map((x) => x * 1088 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 7 }), 37);
}

export function handler_1088(input) {
  const scaled = input.map((x) => x * 1089 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 8 }), 38);
}

export function handler_1089(input) {
  const scaled = input.map((x) => x * 1090 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 9 }), 39);
}

export function handler_1090(input) {
  const scaled = input.map((x) => x * 1091 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 10 }), 40);
}

export function handler_1091(input) {
  const scaled = input.map((x) => x * 1092 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 11 }), 41);
}

export function handler_1092(input) {
  const scaled = input.map((x) => x * 1093 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 12 }), 42);
}

export function handler_1093(input) {
  const scaled = input.map((x) => x * 1094 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 13 }), 43);
}

export function handler_1094(input) {
  const scaled = input.map((x) => x * 1095 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 14 }), 44);
}

export function handler_1095(input) {
  const scaled = input.map((x) => x * 1096 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 15 }), 45);
}

export function handler_1096(input) {
  const scaled = input.map((x) => x * 1097 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 16 }), 46);
}

export function handler_1097(input) {
  const scaled = input.map((x) => x * 1098 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 17 }), 47);
}

export function handler_1098(input) {
  const scaled = input.map((x) => x * 1099 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 18 }), 48);
}

export function handler_1099(input) {
  const scaled = input.map((x) => x * 1100 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 19 }), 49);
}

export function handler_1100(input) {
  const scaled = input.map((x) => x * 1101 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 20 }), 0);
}

export function handler_1101(input) {
  const scaled = input.map((x) => x * 1102 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 21 }), 1);
}

export function handler_1102(input) {
  const scaled = input.map((x) => x * 1103 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 22 }), 2);
}

export function handler_1103(input) {
  const scaled = input.map((x) => x * 1104 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 23 }), 3);
}

export function handler_1104(input) {
  const scaled = input.map((x) => x * 1105 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 24 }), 4);
}

export function handler_1105(input) {
  const scaled = input.map((x) => x * 1106 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 25 }), 5);
}

export function handler_1106(input) {
  const scaled = input.map((x) => x * 1107 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 26 }), 6);
}

export function handler_1107(input) {
  const scaled = input.map((x) => x * 1108 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 27 }), 7);
}

export function handler_1108(input) {
  const scaled = input.map((x) => x * 1109 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 28 }), 8);
}

export function handler_1109(input) {
  const scaled = input.map((x) => x * 1110 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 29 }), 9);
}

export function handler_1110(input) {
  const scaled = input.map((x) => x * 1111 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 30 }), 10);
}

export function handler_1111(input) {
  const scaled = input.map((x) => x * 1112 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 31 }), 11);
}

export function handler_1112(input) {
  const scaled = input.map((x) => x * 1113 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 32 }), 12);
}

export function handler_1113(input) {
  const scaled = input.map((x) => x * 1114 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 33 }), 13);
}

export function handler_1114(input) {
  const scaled = input.map((x) => x * 1115 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 34 }), 14);
}

export function handler_1115(input) {
  const scaled = input.map((x) => x * 1116 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 35 }), 15);
}

export function handler_1116(input) {
  const scaled = input.map((x) => x * 1117 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 36 }), 16);
}

export function handler_1117(input) {
  const scaled = input.map((x) => x * 1118 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 37 }), 17);
}

export function handler_1118(input) {
  const scaled = input.map((x) => x * 1119 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 38 }), 18);
}

export function handler_1119(input) {
  const scaled = input.map((x) => x * 1120 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 39 }), 19);
}

export function handler_1120(input) {
  const scaled = input.map((x) => x * 1121 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 40 }), 20);
}

export function handler_1121(input) {
  const scaled = input.map((x) => x * 1122 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 41 }), 21);
}

export function handler_1122(input) {
  const scaled = input.map((x) => x * 1123 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 42 }), 22);
}

export function handler_1123(input) {
  const scaled = input.map((x) => x * 1124 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 43 }), 23);
}

export function handler_1124(input) {
  const scaled = input.map((x) => x * 1125 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 44 }), 24);
}

export function handler_1125(input) {
  const scaled = input.map((x) => x * 1126 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 45 }), 25);
}

export function handler_1126(input) {
  const scaled = input.map((x) => x * 1127 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 46 }), 26);
}

export function handler_1127(input) {
  const scaled = input.map((x) => x * 1128 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 47 }), 27);
}

export function handler_1128(input) {
  const scaled = input.map((x) => x * 1129 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 48 }), 28);
}

export function handler_1129(input) {
  const scaled = input.map((x) => x * 1130 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 49 }), 29);
}

export function handler_1130(input) {
  const scaled = input.map((x) => x * 1131 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 50 }), 30);
}

export function handler_1131(input) {
  const scaled = input.map((x) => x * 1132 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 51 }), 31);
}

export function handler_1132(input) {
  const scaled = input.map((x) => x * 1133 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 52 }), 32);
}

export function handler_1133(input) {
  const scaled = input.map((x) => x * 1134 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 53 }), 33);
}

export function handler_1134(input) {
  const scaled = input.map((x) => x * 1135 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 54 }), 34);
}

export function handler_1135(input) {
  const scaled = input.map((x) => x * 1136 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 55 }), 35);
}

export function handler_1136(input) {
  const scaled = input.map((x) => x * 1137 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 56 }), 36);
}

export function handler_1137(input) {
  const scaled = input.map((x) => x * 1138 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 57 }), 37);
}

export function handler_1138(input) {
  const scaled = input.map((x) => x * 1139 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 58 }), 38);
}

export function handler_1139(input) {
  const scaled = input.map((x) => x * 1140 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 59 }), 39);
}

export function handler_1140(input) {
  const scaled = input.map((x) => x * 1141 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 60 }), 40);
}

export function handler_1141(input) {
  const scaled = input.map((x) => x * 1142 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 61 }), 41);
}

export function handler_1142(input) {
  const scaled = input.map((x) => x * 1143 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 62 }), 42);
}

export function handler_1143(input) {
  const scaled = input.map((x) => x * 1144 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 63 }), 43);
}

export function handler_1144(input) {
  const scaled = input.map((x) => x * 1145 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 64 }), 44);
}

export function handler_1145(input) {
  const scaled = input.map((x) => x * 1146 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 65 }), 45);
}

export function handler_1146(input) {
  const scaled = input.map((x) => x * 1147 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 66 }), 46);
}

export function handler_1147(input) {
  const scaled = input.map((x) => x * 1148 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 67 }), 47);
}

export function handler_1148(input) {
  const scaled = input.map((x) => x * 1149 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 68 }), 48);
}

export function handler_1149(input) {
  const scaled = input.map((x) => x * 1150 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 69 }), 49);
}

export function handler_1150(input) {
  const scaled = input.map((x) => x * 1151 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 70 }), 0);
}

export function handler_1151(input) {
  const scaled = input.map((x) => x * 1152 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 71 }), 1);
}

export function handler_1152(input) {
  const scaled = input.map((x) => x * 1153 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 72 }), 2);
}

export function handler_1153(input) {
  const scaled = input.map((x) => x * 1154 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 73 }), 3);
}

export function handler_1154(input) {
  const scaled = input.map((x) => x * 1155 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 74 }), 4);
}

export function handler_1155(input) {
  const scaled = input.map((x) => x * 1156 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 75 }), 5);
}

export function handler_1156(input) {
  const scaled = input.map((x) => x * 1157 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 76 }), 6);
}

export function handler_1157(input) {
  const scaled = input.map((x) => x * 1158 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 77 }), 7);
}

export function handler_1158(input) {
  const scaled = input.map((x) => x * 1159 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 78 }), 8);
}

export function handler_1159(input) {
  const scaled = input.map((x) => x * 1160 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 79 }), 9);
}

export function handler_1160(input) {
  const scaled = input.map((x) => x * 1161 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 80 }), 10);
}

export function handler_1161(input) {
  const scaled = input.map((x) => x * 1162 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 81 }), 11);
}

export function handler_1162(input) {
  const scaled = input.map((x) => x * 1163 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 82 }), 12);
}

export function handler_1163(input) {
  const scaled = input.map((x) => x * 1164 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 83 }), 13);
}

export function handler_1164(input) {
  const scaled = input.map((x) => x * 1165 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 84 }), 14);
}

export function handler_1165(input) {
  const scaled = input.map((x) => x * 1166 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 85 }), 15);
}

export function handler_1166(input) {
  const scaled = input.map((x) => x * 1167 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 86 }), 16);
}

export function handler_1167(input) {
  const scaled = input.map((x) => x * 1168 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 87 }), 17);
}

export function handler_1168(input) {
  const scaled = input.map((x) => x * 1169 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 88 }), 18);
}

export function handler_1169(input) {
  const scaled = input.map((x) => x * 1170 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 89 }), 19);
}

export function handler_1170(input) {
  const scaled = input.map((x) => x * 1171 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 90 }), 20);
}

export function handler_1171(input) {
  const scaled = input.map((x) => x * 1172 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 91 }), 21);
}

export function handler_1172(input) {
  const scaled = input.map((x) => x * 1173 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 92 }), 22);
}

export function handler_1173(input) {
  const scaled = input.map((x) => x * 1174 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 93 }), 23);
}

export function handler_1174(input) {
  const scaled = input.map((x) => x * 1175 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 94 }), 24);
}

export function handler_1175(input) {
  const scaled = input.map((x) => x * 1176 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 95 }), 25);
}

export function handler_1176(input) {
  const scaled = input.map((x) => x * 1177 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 96 }), 26);
}

export function handler_1177(input) {
  const scaled = input.map((x) => x * 1178 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 97 }), 27);
}

export function handler_1178(input) {
  const scaled = input.map((x) => x * 1179 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 98 }), 28);
}

export function handler_1179(input) {
  const scaled = input.map((x) => x * 1180 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 99 }), 29);
}

export function handler_1180(input) {
  const scaled = input.map((x) => x * 1181 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 100 }), 30);
}

export function handler_1181(input) {
  const scaled = input.map((x) => x * 1182 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 101 }), 31);
}

export function handler_1182(input) {
  const scaled = input.map((x) => x * 1183 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 102 }), 32);
}

export function handler_1183(input) {
  const scaled = input.map((x) => x * 1184 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 103 }), 33);
}

export function handler_1184(input) {
  const scaled = input.map((x) => x * 1185 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 104 }), 34);
}

export function handler_1185(input) {
  const scaled = input.map((x) => x * 1186 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 105 }), 35);
}

export function handler_1186(input) {
  const scaled = input.map((x) => x * 1187 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 106 }), 36);
}

export function handler_1187(input) {
  const scaled = input.map((x) => x * 1188 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 107 }), 37);
}

export function handler_1188(input) {
  const scaled = input.map((x) => x * 1189 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 108 }), 38);
}

export function handler_1189(input) {
  const scaled = input.map((x) => x * 1190 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 109 }), 39);
}

export function handler_1190(input) {
  const scaled = input.map((x) => x * 1191 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 110 }), 40);
}

export function handler_1191(input) {
  const scaled = input.map((x) => x * 1192 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 111 }), 41);
}

export function handler_1192(input) {
  const scaled = input.map((x) => x * 1193 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 112 }), 42);
}

export function handler_1193(input) {
  const scaled = input.map((x) => x * 1194 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 113 }), 43);
}

export function handler_1194(input) {
  const scaled = input.map((x) => x * 1195 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 114 }), 44);
}

export function handler_1195(input) {
  const scaled = input.map((x) => x * 1196 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 115 }), 45);
}

export function handler_1196(input) {
  const scaled = input.map((x) => x * 1197 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 116 }), 46);
}

export function handler_1197(input) {
  const scaled = input.map((x) => x * 1198 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 117 }), 47);
}

export function handler_1198(input) {
  const scaled = input.map((x) => x * 1199 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 118 }), 48);
}

export function handler_1199(input) {
  const scaled = input.map((x) => x * 1200 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 119 }), 49);
}

export function handler_1200(input) {
  const scaled = input.map((x) => x * 1201 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 120 }), 0);
}

export function handler_1201(input) {
  const scaled = input.map((x) => x * 1202 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 121 }), 1);
}

export function handler_1202(input) {
  const scaled = input.map((x) => x * 1203 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 122 }), 2);
}

export function handler_1203(input) {
  const scaled = input.map((x) => x * 1204 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 123 }), 3);
}

export function handler_1204(input) {
  const scaled = input.map((x) => x * 1205 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 124 }), 4);
}

export function handler_1205(input) {
  const scaled = input.map((x) => x * 1206 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 125 }), 5);
}

export function handler_1206(input) {
  const scaled = input.map((x) => x * 1207 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 126 }), 6);
}

export function handler_1207(input) {
  const scaled = input.map((x) => x * 1208 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 127 }), 7);
}

export function handler_1208(input) {
  const scaled = input.map((x) => x * 1209 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 128 }), 8);
}

export function handler_1209(input) {
  const scaled = input.map((x) => x * 1210 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 129 }), 9);
}

export function handler_1210(input) {
  const scaled = input.map((x) => x * 1211 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 130 }), 10);
}

export function handler_1211(input) {
  const scaled = input.map((x) => x * 1212 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 131 }), 11);
}

export function handler_1212(input) {
  const scaled = input.map((x) => x * 1213 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 132 }), 12);
}

export function handler_1213(input) {
  const scaled = input.map((x) => x * 1214 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 133 }), 13);
}

export function handler_1214(input) {
  const scaled = input.map((x) => x * 1215 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 134 }), 14);
}

export function handler_1215(input) {
  const scaled = input.map((x) => x * 1216 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 135 }), 15);
}

export function handler_1216(input) {
  const scaled = input.map((x) => x * 1217 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 136 }), 16);
}

export function handler_1217(input) {
  const scaled = input.map((x) => x * 1218 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 137 }), 17);
}

export function handler_1218(input) {
  const scaled = input.map((x) => x * 1219 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 138 }), 18);
}

export function handler_1219(input) {
  const scaled = input.map((x) => x * 1220 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 139 }), 19);
}

export function handler_1220(input) {
  const scaled = input.map((x) => x * 1221 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 140 }), 20);
}

export function handler_1221(input) {
  const scaled = input.map((x) => x * 1222 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 141 }), 21);
}

export function handler_1222(input) {
  const scaled = input.map((x) => x * 1223 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 142 }), 22);
}

export function handler_1223(input) {
  const scaled = input.map((x) => x * 1224 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 143 }), 23);
}

export function handler_1224(input) {
  const scaled = input.map((x) => x * 1225 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 144 }), 24);
}

export function handler_1225(input) {
  const scaled = input.map((x) => x * 1226 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 145 }), 25);
}

export function handler_1226(input) {
  const scaled = input.map((x) => x * 1227 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 146 }), 26);
}

export function handler_1227(input) {
  const scaled = input.map((x) => x * 1228 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 147 }), 27);
}

export function handler_1228(input) {
  const scaled = input.map((x) => x * 1229 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 148 }), 28);
}

export function handler_1229(input) {
  const scaled = input.map((x) => x * 1230 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 149 }), 29);
}

export function handler_1230(input) {
  const scaled = input.map((x) => x * 1231 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 150 }), 30);
}

export function handler_1231(input) {
  const scaled = input.map((x) => x * 1232 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 151 }), 31);
}

export function handler_1232(input) {
  const scaled = input.map((x) => x * 1233 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 152 }), 32);
}

export function handler_1233(input) {
  const scaled = input.map((x) => x * 1234 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 153 }), 33);
}

export function handler_1234(input) {
  const scaled = input.map((x) => x * 1235 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 154 }), 34);
}

export function handler_1235(input) {
  const scaled = input.map((x) => x * 1236 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 155 }), 35);
}

export function handler_1236(input) {
  const scaled = input.map((x) => x * 1237 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 156 }), 36);
}

export function handler_1237(input) {
  const scaled = input.map((x) => x * 1238 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 157 }), 37);
}

export function handler_1238(input) {
  const scaled = input.map((x) => x * 1239 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 158 }), 38);
}

export function handler_1239(input) {
  const scaled = input.map((x) => x * 1240 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 159 }), 39);
}

export function handler_1240(input) {
  const scaled = input.map((x) => x * 1241 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 160 }), 40);
}

export function handler_1241(input) {
  const scaled = input.map((x) => x * 1242 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 161 }), 41);
}

export function handler_1242(input) {
  const scaled = input.map((x) => x * 1243 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 162 }), 42);
}

export function handler_1243(input) {
  const scaled = input.map((x) => x * 1244 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 163 }), 43);
}

export function handler_1244(input) {
  const scaled = input.map((x) => x * 1245 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 164 }), 44);
}

export function handler_1245(input) {
  const scaled = input.map((x) => x * 1246 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 165 }), 45);
}

export function handler_1246(input) {
  const scaled = input.map((x) => x * 1247 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 166 }), 46);
}

export function handler_1247(input) {
  const scaled = input.map((x) => x * 1248 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 167 }), 47);
}

export function handler_1248(input) {
  const scaled = input.map((x) => x * 1249 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 168 }), 48);
}

export function handler_1249(input) {
  const scaled = input.map((x) => x * 1250 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 169 }), 49);
}

export function handler_1250(input) {
  const scaled = input.map((x) => x * 1251 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 170 }), 0);
}

export function handler_1251(input) {
  const scaled = input.map((x) => x * 1252 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 171 }), 1);
}

export function handler_1252(input) {
  const scaled = input.map((x) => x * 1253 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 172 }), 2);
}

export function handler_1253(input) {
  const scaled = input.map((x) => x * 1254 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 173 }), 3);
}

export function handler_1254(input) {
  const scaled = input.map((x) => x * 1255 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 174 }), 4);
}

export function handler_1255(input) {
  const scaled = input.map((x) => x * 1256 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 175 }), 5);
}

export function handler_1256(input) {
  const scaled = input.map((x) => x * 1257 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 176 }), 6);
}

export function handler_1257(input) {
  const scaled = input.map((x) => x * 1258 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 177 }), 7);
}

export function handler_1258(input) {
  const scaled = input.map((x) => x * 1259 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 178 }), 8);
}

export function handler_1259(input) {
  const scaled = input.map((x) => x * 1260 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 179 }), 9);
}

export function handler_1260(input) {
  const scaled = input.map((x) => x * 1261 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 180 }), 10);
}

export function handler_1261(input) {
  const scaled = input.map((x) => x * 1262 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 181 }), 11);
}

export function handler_1262(input) {
  const scaled = input.map((x) => x * 1263 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 182 }), 12);
}

export function handler_1263(input) {
  const scaled = input.map((x) => x * 1264 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 183 }), 13);
}

export function handler_1264(input) {
  const scaled = input.map((x) => x * 1265 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 184 }), 14);
}

export function handler_1265(input) {
  const scaled = input.map((x) => x * 1266 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 185 }), 15);
}

export function handler_1266(input) {
  const scaled = input.map((x) => x * 1267 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 186 }), 16);
}

export function handler_1267(input) {
  const scaled = input.map((x) => x * 1268 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 187 }), 17);
}

export function handler_1268(input) {
  const scaled = input.map((x) => x * 1269 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 188 }), 18);
}

export function handler_1269(input) {
  const scaled = input.map((x) => x * 1270 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 189 }), 19);
}

export function handler_1270(input) {
  const scaled = input.map((x) => x * 1271 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 190 }), 20);
}

export function handler_1271(input) {
  const scaled = input.map((x) => x * 1272 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 191 }), 21);
}

export function handler_1272(input) {
  const scaled = input.map((x) => x * 1273 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 192 }), 22);
}

export function handler_1273(input) {
  const scaled = input.map((x) => x * 1274 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 193 }), 23);
}

export function handler_1274(input) {
  const scaled = input.map((x) => x * 1275 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 194 }), 24);
}

export function handler_1275(input) {
  const scaled = input.map((x) => x * 1276 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 195 }), 25);
}

export function handler_1276(input) {
  const scaled = input.map((x) => x * 1277 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 196 }), 26);
}

export function handler_1277(input) {
  const scaled = input.map((x) => x * 1278 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 197 }), 27);
}

export function handler_1278(input) {
  const scaled = input.map((x) => x * 1279 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 198 }), 28);
}

export function handler_1279(input) {
  const scaled = input.map((x) => x * 1280 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 199 }), 29);
}

export function handler_1280(input) {
  const scaled = input.map((x) => x * 1281 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 200 }), 30);
}

export function handler_1281(input) {
  const scaled = input.map((x) => x * 1282 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 201 }), 31);
}

export function handler_1282(input) {
  const scaled = input.map((x) => x * 1283 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 202 }), 32);
}

export function handler_1283(input) {
  const scaled = input.map((x) => x * 1284 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 203 }), 33);
}

export function handler_1284(input) {
  const scaled = input.map((x) => x * 1285 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 204 }), 34);
}

export function handler_1285(input) {
  const scaled = input.map((x) => x * 1286 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 205 }), 35);
}

export function handler_1286(input) {
  const scaled = input.map((x) => x * 1287 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 206 }), 36);
}

export function handler_1287(input) {
  const scaled = input.map((x) => x * 1288 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 207 }), 37);
}

export function handler_1288(input) {
  const scaled = input.map((x) => x * 1289 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 208 }), 38);
}

export function handler_1289(input) {
  const scaled = input.map((x) => x * 1290 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 209 }), 39);
}

export function handler_1290(input) {
  const scaled = input.map((x) => x * 1291 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 210 }), 40);
}

export function handler_1291(input) {
  const scaled = input.map((x) => x * 1292 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 211 }), 41);
}

export function handler_1292(input) {
  const scaled = input.map((x) => x * 1293 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 212 }), 42);
}

export function handler_1293(input) {
  const scaled = input.map((x) => x * 1294 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 213 }), 43);
}

export function handler_1294(input) {
  const scaled = input.map((x) => x * 1295 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 214 }), 44);
}

export function handler_1295(input) {
  const scaled = input.map((x) => x * 1296 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 215 }), 45);
}

export function handler_1296(input) {
  const scaled = input.map((x) => x * 1297 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 216 }), 46);
}

export function handler_1297(input) {
  const scaled = input.map((x) => x * 1298 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 217 }), 47);
}

export function handler_1298(input) {
  const scaled = input.map((x) => x * 1299 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 218 }), 48);
}

export function handler_1299(input) {
  const scaled = input.map((x) => x * 1300 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 219 }), 49);
}

export function handler_1300(input) {
  const scaled = input.map((x) => x * 1301 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 220 }), 0);
}

export function handler_1301(input) {
  const scaled = input.map((x) => x * 1302 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 221 }), 1);
}

export function handler_1302(input) {
  const scaled = input.map((x) => x * 1303 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 222 }), 2);
}

export function handler_1303(input) {
  const scaled = input.map((x) => x * 1304 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 223 }), 3);
}

export function handler_1304(input) {
  const scaled = input.map((x) => x * 1305 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 224 }), 4);
}

export function handler_1305(input) {
  const scaled = input.map((x) => x * 1306 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 225 }), 5);
}

export function handler_1306(input) {
  const scaled = input.map((x) => x * 1307 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 226 }), 6);
}

export function handler_1307(input) {
  const scaled = input.map((x) => x * 1308 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 227 }), 7);
}

export function handler_1308(input) {
  const scaled = input.map((x) => x * 1309 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 228 }), 8);
}

export function handler_1309(input) {
  const scaled = input.map((x) => x * 1310 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 229 }), 9);
}

export function handler_1310(input) {
  const scaled = input.map((x) => x * 1311 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 230 }), 10);
}

export function handler_1311(input) {
  const scaled = input.map((x) => x * 1312 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 231 }), 11);
}

export function handler_1312(input) {
  const scaled = input.map((x) => x * 1313 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 232 }), 12);
}

export function handler_1313(input) {
  const scaled = input.map((x) => x * 1314 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 233 }), 13);
}

export function handler_1314(input) {
  const scaled = input.map((x) => x * 1315 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 234 }), 14);
}

export function handler_1315(input) {
  const scaled = input.map((x) => x * 1316 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 235 }), 15);
}

export function handler_1316(input) {
  const scaled = input.map((x) => x * 1317 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 236 }), 16);
}

export function handler_1317(input) {
  const scaled = input.map((x) => x * 1318 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 237 }), 17);
}

export function handler_1318(input) {
  const scaled = input.map((x) => x * 1319 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 238 }), 18);
}

export function handler_1319(input) {
  const scaled = input.map((x) => x * 1320 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 239 }), 19);
}

export function handler_1320(input) {
  const scaled = input.map((x) => x * 1321 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 240 }), 20);
}

export function handler_1321(input) {
  const scaled = input.map((x) => x * 1322 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 241 }), 21);
}

export function handler_1322(input) {
  const scaled = input.map((x) => x * 1323 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 242 }), 22);
}

export function handler_1323(input) {
  const scaled = input.map((x) => x * 1324 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 243 }), 23);
}

export function handler_1324(input) {
  const scaled = input.map((x) => x * 1325 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 244 }), 24);
}

export function handler_1325(input) {
  const scaled = input.map((x) => x * 1326 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 245 }), 25);
}

export function handler_1326(input) {
  const scaled = input.map((x) => x * 1327 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 246 }), 26);
}

export function handler_1327(input) {
  const scaled = input.map((x) => x * 1328 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 247 }), 27);
}

export function handler_1328(input) {
  const scaled = input.map((x) => x * 1329 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 248 }), 28);
}

export function handler_1329(input) {
  const scaled = input.map((x) => x * 1330 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 249 }), 29);
}

export function handler_1330(input) {
  const scaled = input.map((x) => x * 1331 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 250 }), 30);
}

export function handler_1331(input) {
  const scaled = input.map((x) => x * 1332 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 251 }), 31);
}

export function handler_1332(input) {
  const scaled = input.map((x) => x * 1333 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 252 }), 32);
}

export function handler_1333(input) {
  const scaled = input.map((x) => x * 1334 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 253 }), 33);
}

export function handler_1334(input) {
  const scaled = input.map((x) => x * 1335 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 254 }), 34);
}

export function handler_1335(input) {
  const scaled = input.map((x) => x * 1336 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 255 }), 35);
}

export function handler_1336(input) {
  const scaled = input.map((x) => x * 1337 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 256 }), 36);
}

export function handler_1337(input) {
  const scaled = input.map((x) => x * 1338 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 257 }), 37);
}

export function handler_1338(input) {
  const scaled = input.map((x) => x * 1339 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 258 }), 38);
}

export function handler_1339(input) {
  const scaled = input.map((x) => x * 1340 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 259 }), 39);
}

export function handler_1340(input) {
  const scaled = input.map((x) => x * 1341 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 260 }), 40);
}

export function handler_1341(input) {
  const scaled = input.map((x) => x * 1342 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 261 }), 41);
}

export function handler_1342(input) {
  const scaled = input.map((x) => x * 1343 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 262 }), 42);
}

export function handler_1343(input) {
  const scaled = input.map((x) => x * 1344 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 263 }), 43);
}

export function handler_1344(input) {
  const scaled = input.map((x) => x * 1345 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 264 }), 44);
}

export function handler_1345(input) {
  const scaled = input.map((x) => x * 1346 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 265 }), 45);
}

export function handler_1346(input) {
  const scaled = input.map((x) => x * 1347 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 266 }), 46);
}

export function handler_1347(input) {
  const scaled = input.map((x) => x * 1348 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 267 }), 47);
}

export function handler_1348(input) {
  const scaled = input.map((x) => x * 1349 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 268 }), 48);
}

export function handler_1349(input) {
  const scaled = input.map((x) => x * 1350 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 269 }), 49);
}

export function handler_1350(input) {
  const scaled = input.map((x) => x * 1351 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 270 }), 0);
}

export function handler_1351(input) {
  const scaled = input.map((x) => x * 1352 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 271 }), 1);
}

export function handler_1352(input) {
  const scaled = input.map((x) => x * 1353 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 272 }), 2);
}

export function handler_1353(input) {
  const scaled = input.map((x) => x * 1354 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 273 }), 3);
}

export function handler_1354(input) {
  const scaled = input.map((x) => x * 1355 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 274 }), 4);
}

export function handler_1355(input) {
  const scaled = input.map((x) => x * 1356 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 275 }), 5);
}

export function handler_1356(input) {
  const scaled = input.map((x) => x * 1357 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 276 }), 6);
}

export function handler_1357(input) {
  const scaled = input.map((x) => x * 1358 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 277 }), 7);
}

export function handler_1358(input) {
  const scaled = input.map((x) => x * 1359 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 278 }), 8);
}

export function handler_1359(input) {
  const scaled = input.map((x) => x * 1360 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 279 }), 9);
}

export function handler_1360(input) {
  const scaled = input.map((x) => x * 1361 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 280 }), 10);
}

export function handler_1361(input) {
  const scaled = input.map((x) => x * 1362 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 281 }), 11);
}

export function handler_1362(input) {
  const scaled = input.map((x) => x * 1363 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 282 }), 12);
}

export function handler_1363(input) {
  const scaled = input.map((x) => x * 1364 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 283 }), 13);
}

export function handler_1364(input) {
  const scaled = input.map((x) => x * 1365 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 284 }), 14);
}

export function handler_1365(input) {
  const scaled = input.map((x) => x * 1366 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 285 }), 15);
}

export function handler_1366(input) {
  const scaled = input.map((x) => x * 1367 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 286 }), 16);
}

export function handler_1367(input) {
  const scaled = input.map((x) => x * 1368 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 287 }), 17);
}

export function handler_1368(input) {
  const scaled = input.map((x) => x * 1369 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 288 }), 18);
}

export function handler_1369(input) {
  const scaled = input.map((x) => x * 1370 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 289 }), 19);
}

export function handler_1370(input) {
  const scaled = input.map((x) => x * 1371 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 290 }), 20);
}

export function handler_1371(input) {
  const scaled = input.map((x) => x * 1372 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 291 }), 21);
}

export function handler_1372(input) {
  const scaled = input.map((x) => x * 1373 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 292 }), 22);
}

export function handler_1373(input) {
  const scaled = input.map((x) => x * 1374 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 293 }), 23);
}

export function handler_1374(input) {
  const scaled = input.map((x) => x * 1375 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 294 }), 24);
}

export function handler_1375(input) {
  const scaled = input.map((x) => x * 1376 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 295 }), 25);
}

export function handler_1376(input) {
  const scaled = input.map((x) => x * 1377 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 296 }), 26);
}

export function handler_1377(input) {
  const scaled = input.map((x) => x * 1378 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 297 }), 27);
}

export function handler_1378(input) {
  const scaled = input.map((x) => x * 1379 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 298 }), 28);
}

export function handler_1379(input) {
  const scaled = input.map((x) => x * 1380 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 299 }), 29);
}

export function handler_1380(input) {
  const scaled = input.map((x) => x * 1381 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 300 }), 30);
}

export function handler_1381(input) {
  const scaled = input.map((x) => x * 1382 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 301 }), 31);
}

export function handler_1382(input) {
  const scaled = input.map((x) => x * 1383 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 302 }), 32);
}

export function handler_1383(input) {
  const scaled = input.map((x) => x * 1384 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 303 }), 33);
}

export function handler_1384(input) {
  const scaled = input.map((x) => x * 1385 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 304 }), 34);
}

export function handler_1385(input) {
  const scaled = input.map((x) => x * 1386 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 305 }), 35);
}

export function handler_1386(input) {
  const scaled = input.map((x) => x * 1387 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 306 }), 36);
}

export function handler_1387(input) {
  const scaled = input.map((x) => x * 1388 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 307 }), 37);
}

export function handler_1388(input) {
  const scaled = input.map((x) => x * 1389 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 308 }), 38);
}

export function handler_1389(input) {
  const scaled = input.map((x) => x * 1390 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 309 }), 39);
}

export function handler_1390(input) {
  const scaled = input.map((x) => x * 1391 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 310 }), 40);
}

export function handler_1391(input) {
  const scaled = input.map((x) => x * 1392 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 311 }), 41);
}

export function handler_1392(input) {
  const scaled = input.map((x) => x * 1393 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 312 }), 42);
}

export function handler_1393(input) {
  const scaled = input.map((x) => x * 1394 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 313 }), 43);
}

export function handler_1394(input) {
  const scaled = input.map((x) => x * 1395 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 314 }), 44);
}

export function handler_1395(input) {
  const scaled = input.map((x) => x * 1396 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 315 }), 45);
}

export function handler_1396(input) {
  const scaled = input.map((x) => x * 1397 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 316 }), 46);
}

export function handler_1397(input) {
  const scaled = input.map((x) => x * 1398 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 317 }), 47);
}

export function handler_1398(input) {
  const scaled = input.map((x) => x * 1399 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 318 }), 48);
}

export function handler_1399(input) {
  const scaled = input.map((x) => x * 1400 + Math.sin(x));
  const total = scaled.reduce((a, b) => a + b, 0);
  return debounce(() => confetti({ particleCount: total | 0, spread: 319 }), 49);
}

