"use client";

import type { ReactNode } from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatMoneyPdf } from "@/lib/format-order";
import type { StatementPdfData } from "@/lib/statement";
import { sumStatementRows } from "@/lib/statement";

const SLATE_DARK = "#0f172a";
const SLATE_700 = "#334155";
const SLATE_500 = "#64748b";
const SLATE_200 = "#e2e8f0";
const SLATE_100 = "#f1f5f9";
const WHITE = "#ffffff";
const ORANGE = "#c8941c";
const EMERALD = "#047857";
const BLUE = "#1d4ed8";
const GREEN = "#15803d";

const styles = StyleSheet.create({
  page: {
    fontSize: 9,
    color: SLATE_DARK,
    fontFamily: "Helvetica",
    padding: 28,
  },
  headerBand: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: ORANGE,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 4,
    marginBottom: 14,
  },
  brandName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
  },
  brandTag: {
    fontSize: 8,
    color: "#fff8e7",
    marginTop: 2,
  },
  title: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    textAlign: "right",
  },
  subtitle: {
    fontSize: 8,
    color: "#fff8e7",
    textAlign: "right",
    marginTop: 2,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  metaText: {
    fontSize: 9,
    color: SLATE_700,
  },
  metaBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: SLATE_DARK,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: SLATE_100,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_200,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: SLATE_200,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  footerRow: {
    flexDirection: "row",
    backgroundColor: SLATE_100,
    borderTopWidth: 1.5,
    borderTopColor: SLATE_700,
    paddingVertical: 7,
    paddingHorizontal: 4,
    marginTop: 2,
  },
  th: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: SLATE_500,
    textTransform: "uppercase",
  },
  td: {
    fontSize: 8,
    color: SLATE_700,
  },
  tdBold: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: SLATE_DARK,
  },
  note: {
    marginTop: 12,
    fontSize: 8,
    color: SLATE_500,
    lineHeight: 1.4,
  },
});

const money = formatMoneyPdf;

function Col({
  children,
  flex,
  align = "left",
  bold,
  color,
}: {
  children: ReactNode;
  flex: number;
  align?: "left" | "right";
  bold?: boolean;
  color?: string;
}) {
  return (
    <View style={{ flex, paddingHorizontal: 2 }}>
      <Text
        style={[
          bold ? styles.tdBold : styles.td,
          { textAlign: align, color: color ?? (bold ? SLATE_DARK : SLATE_700) },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

export default function StatementDocument({ data }: { data: StatementPdfData }) {
  const totals = sumStatementRows(data.rows);
  const paidColor = data.mode === "bank" ? BLUE : GREEN;
  const modeLabel = data.mode === "bank" ? "Bank / UPI" : "Cash";

  return (
    <Document
      title={`Statement ${modeLabel} ${data.rangeLabel}`}
      author="Noorani Makatib"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.headerBand}>
          <View>
            <Text style={styles.brandName}>NOORANI MAKATIB</Text>
            <Text style={styles.brandTag}>Financial Statement</Text>
          </View>
          <View>
            <Text style={styles.title}>{modeLabel.toUpperCase()}</Text>
            <Text style={styles.subtitle}>
              {data.rangeLabel}
              {"\n"}
              Generated {data.generatedAt}
            </Text>
          </View>
        </View>

        <View style={styles.meta}>
          <Text style={styles.metaText}>
            Transactions: <Text style={styles.metaBold}>{data.rows.length}</Text>
          </Text>
          {data.mode === "bank" && data.upiId ? (
            <Text style={styles.metaText}>
              UPI: <Text style={styles.metaBold}>{data.upiId}</Text>
            </Text>
          ) : null}
        </View>

        <View style={styles.tableHeader}>
          <View style={{ flex: 1.2, paddingHorizontal: 2 }}>
            <Text style={styles.th}>Date</Text>
          </View>
          <View style={{ flex: 1.4, paddingHorizontal: 2 }}>
            <Text style={styles.th}>Order ID</Text>
          </View>
          <View style={{ flex: 2, paddingHorizontal: 2 }}>
            <Text style={styles.th}>Customer</Text>
          </View>
          <View style={{ flex: 1.3, paddingHorizontal: 2 }}>
            <Text style={[styles.th, { textAlign: "right" }]}>Customer Paid</Text>
          </View>
          <View style={{ flex: 1.1, paddingHorizontal: 2 }}>
            <Text style={[styles.th, { textAlign: "right" }]}>Packaging</Text>
          </View>
          <View style={{ flex: 1.1, paddingHorizontal: 2 }}>
            <Text style={[styles.th, { textAlign: "right" }]}>Courier</Text>
          </View>
          <View style={{ flex: 1.3, paddingHorizontal: 2 }}>
            <Text style={[styles.th, { textAlign: "right" }]}>Total Earn</Text>
          </View>
          <View style={{ flex: 1.3, paddingHorizontal: 2 }}>
            <Text style={[styles.th, { textAlign: "right" }]}>Profit</Text>
          </View>
        </View>

        {data.rows.map((row, idx) => (
          <View
            key={row.id}
            style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
            wrap={false}
          >
            <Col flex={1.2}>
              {new Date(row.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "2-digit",
              })}
            </Col>
            <Col flex={1.4} bold>
              {row.id}
            </Col>
            <Col flex={2}>{row.customer_name}</Col>
            <Col flex={1.3} align="right" bold color={paidColor}>
              {money(row.customerPaid)}
            </Col>
            <Col flex={1.1} align="right">
              {money(row.packaging)}
            </Col>
            <Col flex={1.1} align="right">
              {money(row.courier)}
            </Col>
            <Col flex={1.3} align="right" bold>
              {money(row.totalEarn)}
            </Col>
            <Col flex={1.3} align="right" bold color={EMERALD}>
              {money(row.profit)}
            </Col>
          </View>
        ))}

        <View style={styles.footerRow} wrap={false}>
          <Col flex={1.2 + 1.4 + 2} bold>
            Total ({data.rows.length})
          </Col>
          <Col flex={1.3} align="right" bold color={paidColor}>
            {money(totals.customerPaid)}
          </Col>
          <Col flex={1.1} align="right" bold>
            {money(totals.packaging)}
          </Col>
          <Col flex={1.1} align="right" bold>
            {money(totals.courier)}
          </Col>
          <Col flex={1.3} align="right" bold>
            {money(totals.totalEarn)}
          </Col>
          <Col flex={1.3} align="right" bold color={EMERALD}>
            {money(totals.profit)}
          </Col>
        </View>

        <Text style={styles.note}>
          Customer Paid = books + packaging + courier. Total Earn = book sales
          after discount (excludes packaging &amp; courier). Profit = Total Earn
          minus book buy cost.
        </Text>
      </Page>
    </Document>
  );
}
