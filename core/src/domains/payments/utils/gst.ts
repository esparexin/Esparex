/**
 * gst.ts — GST amount utilities (payments domain).
 *
 * Canonical SSOT for splitting GST-inclusive (18% slab) amounts.
 * Controllers and invoice builders must consume splitGstFromInclusive
 * instead of hand-rolling amount/1.18 math.
 */

/** GST-inclusive divisor for the 18% slab (9% CGST + 9% SGST). */
export const GST_INCLUSIVE_DIVISOR = 1.18;

export type GstInclusiveSplit = {
    subtotal: number;
    gstAmount: number;
    cgst: number;
    sgst: number;
};

/**
 * splitGstFromInclusive — splits a GST-inclusive amount into subtotal +
 * CGST/SGST with canonical toFixed(2) rounding.
 */
export const splitGstFromInclusive = (inclusiveAmount: number): GstInclusiveSplit => {
    const subtotal = Number((inclusiveAmount / GST_INCLUSIVE_DIVISOR).toFixed(2));
    const gstAmount = Number((inclusiveAmount - subtotal).toFixed(2));
    const halfTax = Number((gstAmount / 2).toFixed(2));
    return { subtotal, gstAmount, cgst: halfTax, sgst: halfTax };
};
