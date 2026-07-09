"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { InvoiceData, InvoiceItem } from "@/lib/invoice";
import { formatDeliveryType, formatMoneyPdf } from "@/lib/format-order";

export type { InvoiceData, InvoiceItem };

// Brand colors
const ORANGE = "#c8941c";
const ORANGE_DARK = "#a37114";
const GREEN = "#059669";
const EMERALD = "#047857";
const SLATE_DARK = "#0f172a";
const SLATE_700 = "#334155";
const SLATE_500 = "#64748b";
const SLATE_200 = "#e2e8f0";
const SLATE_100 = "#f1f5f9";
const WHITE = "#ffffff";

const styles = StyleSheet.create({
  page: {
    fontSize: 10,
    color: SLATE_DARK,
    fontFamily: "Helvetica",
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
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    letterSpacing: 0.5,
  },
  brandTag: {
    fontSize: 9,
    color: "#fff8e7",
    marginTop: 2,
  },
  invoiceTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    letterSpacing: 1,
  },
  invoiceSubtitle: {
    fontSize: 8,
    color: "#fff8e7",
    textAlign: "right",
    marginTop: 2,
  },
  topPad: { height: 14 },
  twoCol: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: SLATE_500,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  boxLine: { marginBottom: 10 },
  valueText: { fontSize: 10, color: SLATE_700 },
  valueBold: { fontSize: 10, color: SLATE_DARK, fontFamily: "Helvetica-Bold" },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: SLATE_200,
    marginVertical: 12,
  },
  dividerThick: {
    borderBottomWidth: 1.5,
    borderBottomColor: SLATE_DARK,
    marginVertical: 10,
  },
  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: SLATE_DARK,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  th: {
    color: WHITE,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: SLATE_200,
  },
  rowAlt: { backgroundColor: SLATE_100 },
  cell: { fontSize: 10, color: SLATE_700 },
  cellBold: {
    fontSize: 10,
    color: SLATE_DARK,
    fontFamily: "Helvetica-Bold",
  },
  quranBadge: {
    fontSize: 7,
    color: EMERALD,
    fontFamily: "Helvetica-Bold",
    marginLeft: 4,
  },
  // Totals
  totalsWrap: { marginTop: 8, alignSelf: "flex-end", width: 260 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  totalGrand: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: ORANGE,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginTop: 6,
  },
  totalGrandLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
  },
  totalGrandValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
  },
  discountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  discountValue: {
    fontFamily: "Helvetica-Bold",
  },
  // Payment block
  payBlock: {
    flexDirection: "row",
    marginTop: 14,
    borderWidth: 1,
    borderColor: ORANGE_DARK,
    borderRadius: 4,
    overflow: "hidden",
  },
  payBlockLeft: {
    backgroundColor: ORANGE,
    paddingVertical: 8,
    paddingHorizontal: 10,
    width: 90,
  },
  payBlockLeftText: {
    color: WHITE,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textTransform: "uppercase",
  },
  payBlockRight: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff8e7",
  },
  payLine: { fontSize: 10, color: SLATE_700, marginBottom: 2 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    textAlign: "center",
    fontSize: 8,
    color: SLATE_500,
    borderTopWidth: 0.5,
    borderTopColor: SLATE_200,
    paddingTop: 8,
  },
});

const money = formatMoneyPdf;

function ItemRow({ item, idx }: { item: InvoiceItem; idx: number }) {
  const amount = item.price * item.quantity;
  return (
    <View style={[styles.row, idx % 2 === 0 ? styles.rowAlt : {}]}>
      <Text style={[styles.cell, { flex: 6 }]}>
        {item.book_name}
        {item.is_quran ? (
          <Text style={styles.quranBadge}>· QURAN</Text>
        ) : null}
      </Text>
      <Text style={[styles.cell, { flex: 1, textAlign: "center" }]}>
        {item.quantity}
      </Text>
      <Text style={[styles.cell, { flex: 2, textAlign: "right" }]}>
        {money(item.price)}
      </Text>
      <Text style={[styles.cellBold, { flex: 2, textAlign: "right" }]}>
        {money(amount)}
      </Text>
    </View>
  );
}

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  const quranDisc = data.quranDiscount ?? 0;
  const pctDisc = data.percentageDiscount ?? 0;

  return (
    <Document title={`Invoice ${data.id}`} author="Noorani Makatib">
      <Page size="A4" style={styles.page}>
        {/* Header band */}
        <View style={styles.headerBand}>
          <View>
            <Text style={styles.brandName}>NOORANI MAKATIB</Text>
            <Text style={styles.brandTag}>
              Educational Islamic &amp; Urdu Books
            </Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
            <Text style={styles.invoiceSubtitle}>
              Invoice #{data.id}
              {"\n"}
              {new Date(data.created_at).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.topPad} />

        {/* Bill To + Invoice details */}
        <View style={styles.twoCol}>
          <View style={{ width: "55%" }}>
            <Text style={styles.label}>Bill To</Text>
            <Text style={[styles.valueBold, { marginBottom: 2 }]}>
              {data.customer_name}
            </Text>
            {data.customer_phone ? (
              <Text style={styles.valueText}>
                Phone: {data.customer_phone}
                {"\n"}
              </Text>
            ) : null}
            {data.customer_email ? (
              <Text style={styles.valueText}>
                {data.customer_email}
                {"\n"}
              </Text>
            ) : null}
            {data.customer_address ? (
              <Text style={styles.valueText}>{data.customer_address}</Text>
            ) : null}
          </View>

          <View style={{ width: "40%" }}>
            <Text style={styles.label}>Invoice Details</Text>
            <View style={styles.boxLine}>
              <Text style={styles.valueText}>
                Order ID:{" "}
                <Text style={styles.valueBold}>{data.id}</Text>
              </Text>
            </View>
            <View style={styles.boxLine}>
              <Text style={styles.valueText}>
                Payment:{" "}
                <Text
                  style={[
                    styles.valueBold,
                    {
                      color:
                        data.payment_type === "bank"
                          ? "#2563eb"
                          : EMERALD,
                    },
                  ]}
                >
                  {data.payment_type === "bank"
                    ? "BANK / UPI"
                    : "CASH ON DELIVERY"}
                </Text>
              </Text>
            </View>
            <View style={styles.boxLine}>
              <Text style={styles.valueText}>
                Delivery:{" "}
                <Text style={styles.valueBold}>
                  {formatDeliveryType(data.delivery_type)}
                </Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.dividerThick} />

        {/* Items table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 6 }]}>Item</Text>
          <Text style={[styles.th, { flex: 1, textAlign: "center" }]}>
            Qty
          </Text>
          <Text style={[styles.th, { flex: 2, textAlign: "right" }]}>
            Price
          </Text>
          <Text style={[styles.th, { flex: 2, textAlign: "right" }]}>
            Amount
          </Text>
        </View>

        {data.items.map((item, idx) => (
          <ItemRow key={idx} item={item} idx={idx} />
        ))}

        {/* Totals */}
        <View style={styles.totalsWrap}>
          <View style={styles.totalRow}>
            <Text style={styles.valueText}>Subtotal</Text>
            <Text style={styles.valueBold}>{money(data.subtotal)}</Text>
          </View>
          {quranDisc > 0 && (
            <View style={styles.discountRow}>
              <Text style={{ fontSize: 10, color: EMERALD }}>
                Quran discount (Rs. 25 per copy)
              </Text>
              <Text
                style={[
                  styles.discountValue,
                  { fontSize: 10, color: EMERALD },
                ]}
              >
                -{money(quranDisc)}
              </Text>
            </View>
          )}
          {pctDisc > 0 && (
            <View style={styles.discountRow}>
              <Text style={{ fontSize: 10, color: GREEN }}>
                {data.payment_type === "bank" ? "10%" : "15%"} discount (books)
              </Text>
              <Text
                style={[
                  styles.discountValue,
                  { fontSize: 10, color: GREEN },
                ]}
              >
                -{money(pctDisc)}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.valueText}>Packaging / پیکجنگ</Text>
            <Text style={styles.valueBold}>
              {data.packaging_charge > 0 ? money(data.packaging_charge) : "On call"}
            </Text>
          </View>
          {(data.courier_charge ?? 0) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.valueText}>Courier / کورئیر</Text>
              <Text style={styles.valueBold}>{money(data.courier_charge ?? 0)}</Text>
            </View>
          )}

          <View style={styles.totalGrand}>
            <Text style={styles.totalGrandLabel}>Total</Text>
            <Text style={styles.totalGrandValue}>{money(data.total)}</Text>
          </View>
        </View>

        {/* Payment details block (bank/UPI only) */}
        {data.payment_type === "bank" && (
          <View style={styles.payBlock}>
            <View style={styles.payBlockLeft}>
              <Text style={styles.payBlockLeftText}>
                PAYMENT
                {"\n"}
                RECEIVED
              </Text>
            </View>
            <View style={styles.payBlockRight}>
              <Text style={styles.payLine}>
                Payee:{" "}
                <Text style={styles.valueBold}>
                  {data.payee_name || "ADNAN IBADULLAH ARODIYA"}
                </Text>
              </Text>
              <Text style={styles.payLine}>
                UPI ID:{" "}
                <Text style={styles.valueBold}>{data.upi_id || "—"}</Text>
              </Text>
              <Text style={styles.payLine}>
                Amount Paid:{" "}
                <Text style={styles.valueBold}>{money(data.total)}</Text>
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.footer} fixed>
          This is a system-generated invoice from Noorani Makatib ·
          nooranimakatib.com
        </Text>
      </Page>
    </Document>
  );
}