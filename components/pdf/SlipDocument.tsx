"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { SlipData } from "@/lib/slip";

export type { SlipData, SlipItem } from "@/lib/slip";

const BLACK = "#000000";
const DARK = "#1f2937";
const GREY = "#6b7280";
const LINE = "#d1d5db";

// B&W, print-friendly thermal/A4 label style
const styles = StyleSheet.create({
  page: {
    fontSize: 11,
    color: DARK,
    fontFamily: "Helvetica",
    padding: 32,
  },
  headerBox: {
    borderWidth: 2,
    borderColor: BLACK,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    color: BLACK,
    letterSpacing: 1,
  },
  headerSub: {
    fontSize: 8.5,
    color: GREY,
    textAlign: "center",
    marginTop: 2,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: LINE,
  },
  label: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: GREY,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 10.5,
    color: DARK,
    fontFamily: "Helvetica-Bold",
  },
  valueMono: {
    fontSize: 10.5,
    color: BLACK,
    fontFamily: "Helvetica-Bold",
  },
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: BLACK,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 4,
  },
  itemsBox: {
    borderWidth: 1,
    borderColor: BLACK,
  },
  itemRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: LINE,
  },
  itemName: { fontSize: 10, flex: 5 },
  itemQty: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    flex: 1,
    textAlign: "right",
  },
  stampBox: {
    marginTop: 20,
    borderWidth: 0.5,
    borderColor: GREY,
    borderStyle: "dashed",
    padding: 8,
    textAlign: "center",
  },
  stampText: { fontSize: 9, color: GREY },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 32,
    right: 32,
    textAlign: "center",
    fontSize: 7.5,
    color: GREY,
  },
});

export function SlipDocument({ slip }: { slip: SlipData }) {
  return (
    <Document title={`Slip ${slip.id}`} author="Noorani Makatib">
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>PACKING &amp; SHIPPING SLIP</Text>
          <Text style={styles.headerSub}>
            Noorani Makatib · attach this slip to the packed box for delivery
          </Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.label}>Order ID</Text>
          <Text style={styles.valueMono}>{slip.id}</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.label}>Customer</Text>
          <Text style={styles.value}>{slip.customer_name}</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.valueMono}>{slip.customer_phone}</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.label}>Delivery Method</Text>
          <Text style={styles.value}>
            {slip.delivery_type.toUpperCase()}
          </Text>
        </View>

        <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.label}>Shipping Address</Text>
          <Text
            style={[
              styles.value,
              { textAlign: "right", maxWidth: "60%", lineHeight: 1.3 },
            ]}
          >
            {slip.customer_address || "—"}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Pack Contents</Text>
        <View style={styles.itemsBox}>
          {slip.items.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.itemRow,
                idx === slip.items.length - 1
                  ? { borderBottomWidth: 0 }
                  : {},
              ]}
            >
              <Text style={styles.itemName}>{item.book_name}</Text>
              <Text style={styles.itemQty}>x {item.quantity}</Text>
            </View>
          ))}
        </View>

        <View style={styles.stampBox}>
          <Text style={styles.stampText}>
            STAMP / SIGNATURE
            {"\n"}
            ____________________________
          </Text>
        </View>

        <Text style={styles.footer} fixed>
          Slipped on{" "}
          {slip.created_at
            ? new Date(slip.created_at).toLocaleString()
            : new Date().toLocaleString()}{" "}
          · Noorani Makatib
        </Text>
      </Page>
    </Document>
  );
}