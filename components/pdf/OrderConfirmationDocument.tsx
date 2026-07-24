"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { OrderConfirmationData } from "@/lib/order-confirmation";
import { formatDeliveryType, formatMoneyPdf } from "@/lib/format-order";
import { registerPdfFonts, PDF_FONT_LATIN, pdfFontForText } from "@/lib/pdf-fonts";
import { bulkDiscountPercent } from "@/lib/discounts";

registerPdfFonts();

const ORANGE = "#c8941c";
const SLATE_DARK = "#0f172a";
const SLATE_700 = "#334155";
const SLATE_500 = "#64748b";
const SLATE_200 = "#e2e8f0";
const SLATE_100 = "#f1f5f9";
const WHITE = "#ffffff";
const GREEN = "#059669";
const EMERALD = "#047857";

const styles = StyleSheet.create({
  page: {
    fontSize: 10,
    color: SLATE_DARK,
    fontFamily: PDF_FONT_LATIN,
    padding: 36,
  },
  headerBand: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: ORANGE,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 4,
  },
  brandName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
  },
  brandTag: { fontSize: 8, color: "#fff8e7", marginTop: 2 },
  docTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    textAlign: "right",
  },
  statusBadge: {
    marginTop: 6,
    alignSelf: "flex-end",
    backgroundColor: "#fff8e7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  statusText: { fontSize: 8, color: ORANGE, fontFamily: "Helvetica-Bold" },
  topPad: { height: 14 },
  label: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: SLATE_500,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  valueText: { fontSize: 10, color: SLATE_700 },
  valueBold: { fontSize: 10, color: SLATE_DARK, fontFamily: "Helvetica-Bold" },
  twoCol: { flexDirection: "row", justifyContent: "space-between" },
  boxLine: { marginBottom: 8 },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: SLATE_200,
    marginVertical: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: SLATE_DARK,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  th: {
    color: WHITE,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: SLATE_200,
  },
  rowAlt: { backgroundColor: SLATE_100 },
  colItem: { width: "50%" },
  colQty: { width: "15%", textAlign: "center" },
  colPrice: { width: "17%", textAlign: "right" },
  colTotal: { width: "18%", textAlign: "right" },
  totalsBox: {
    marginTop: 8,
    padding: 12,
    backgroundColor: SLATE_100,
    borderRadius: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalGrand: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1.5,
    borderTopColor: SLATE_DARK,
  },
  totalGrandLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: SLATE_DARK,
  },
  totalGrandValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: ORANGE,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 36,
    right: 36,
    fontSize: 8,
    color: SLATE_500,
    textAlign: "center",
  },
  bilingual: { fontSize: 9, color: SLATE_500, marginTop: 2 },
});

const money = formatMoneyPdf;

export default function OrderConfirmationDocument({
  data,
}: {
  data: OrderConfirmationData;
}) {
  const quranDisc = data.quranDiscount ?? 0;
  const pctDisc = data.percentageDiscount ?? 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBand}>
          <View>
            <Text style={styles.brandName}>Noorani Makatib</Text>
            <Text style={styles.brandTag}>Noorani Makatib — Order Confirmation</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>ORDER CONFIRMATION</Text>
            <Text style={{ fontSize: 9, color: "#fff8e7", textAlign: "right" }}>
              {data.id}
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{data.statusLabel.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.topPad} />

        <View style={styles.twoCol}>
          <View style={{ width: "48%" }}>
            <Text style={styles.label}>Customer</Text>
            <Text style={[styles.valueBold, { fontFamily: pdfFontForText(data.customer_name) }]}>
              {data.customer_name}
            </Text>
            <Text style={styles.valueText}>{data.customer_phone}</Text>
          </View>
          <View style={{ width: "48%" }}>
            <Text style={styles.label}>Order Details</Text>
            <Text style={styles.valueText}>
              Date: {new Date(data.created_at).toLocaleDateString("en-IN")}
            </Text>
            <Text style={styles.valueText}>
              Delivery: {formatDeliveryType(data.delivery_type)}
            </Text>
            <Text style={styles.valueText}>
              Payment: {data.payment_type === "bank" ? "Bank / UPI" : "Cash on Delivery"}
            </Text>
          </View>
        </View>

        <View style={[styles.boxLine, { marginTop: 10 }]}>
          <Text style={styles.label}>Shipping Address</Text>
          <Text style={styles.valueText}>{data.customer_address}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.colItem]}>Book</Text>
          <Text style={[styles.th, styles.colQty]}>Qty</Text>
          <Text style={[styles.th, styles.colPrice]}>Price</Text>
          <Text style={[styles.th, styles.colTotal]}>Total</Text>
        </View>

        {data.items.map((item, idx) => (
          <View
            key={`${item.book_name}-${idx}`}
            style={[styles.row, idx % 2 === 1 ? styles.rowAlt : {}]}
          >
            <Text style={[styles.valueText, styles.colItem, { fontFamily: pdfFontForText(item.book_name) }]}>
              {item.book_name}
            </Text>
            <Text style={[styles.valueText, styles.colQty]}>{item.quantity}</Text>
            <Text style={[styles.valueText, styles.colPrice]}>{money(item.price)}</Text>
            <Text style={[styles.valueBold, styles.colTotal]}>
              {money(item.price * item.quantity)}
            </Text>
          </View>
        ))}

        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.valueText}>Subtotal</Text>
            <Text style={styles.valueBold}>{money(data.subtotal)}</Text>
          </View>
          {quranDisc > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ fontSize: 10, color: EMERALD }}>
                Quran discount (₹25/copy)
              </Text>
              <Text style={{ fontSize: 10, color: EMERALD, fontFamily: "Helvetica-Bold" }}>
                -{money(quranDisc)}
              </Text>
            </View>
          )}
          {pctDisc > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ fontSize: 10, color: GREEN }}>
                {bulkDiscountPercent(data.payment_type === "cash" ? "cash" : "bank")}% discount (books, orders ₹5,000+)
              </Text>
              <Text style={{ fontSize: 10, color: GREEN, fontFamily: "Helvetica-Bold" }}>
                -{money(pctDisc)}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.valueText}>Products total</Text>
            <Text style={styles.valueBold}>{money(data.productsTotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.valueText}>Packaging</Text>
            <Text style={styles.valueBold}>{money(data.packaging_charge)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.valueText}>Courier</Text>
            <Text style={styles.valueBold}>{money(data.courier_charge)}</Text>
          </View>
          <View style={styles.totalGrand}>
            <Text style={styles.totalGrandLabel}>Grand Total</Text>
            <Text style={styles.totalGrandValue}>{money(data.total)}</Text>
          </View>
        </View>

        {data.admin_notes ? (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.label}>Notes</Text>
            <Text style={[styles.valueText, { fontFamily: pdfFontForText(data.admin_notes) }]}>
              {data.admin_notes}
            </Text>
          </View>
        ) : null}

        <Text style={styles.footer} fixed>
          Order confirmed by phone · Noorani Makatib · nooranimakatib.com
        </Text>
      </Page>
    </Document>
  );
}
