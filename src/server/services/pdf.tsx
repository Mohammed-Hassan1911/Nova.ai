import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  type DocumentProps,
} from '@react-pdf/renderer'
import { fmtExact, formatDate } from '@/lib/utils'
import type { InvoiceWithItems } from '@/server/services/invoices'
import type { Client } from '@prisma/client'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    color: '#18181b',
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  brand: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 4,
    color: '#8a6d3b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  invoiceTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 8,
  },
  meta: {
    color: '#52525b',
    fontSize: 9,
    marginTop: 2,
  },
  label: {
    color: '#71717a',
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  parties: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  partyBlock: {
    width: '45%',
  },
  h3: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  body: {
    color: '#3f3f46',
    fontSize: 9,
    lineHeight: 1.5,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d4d4d8',
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e4e4e7',
  },
  colDesc: { width: '48%' },
  colQty: { width: '12%', textAlign: 'right' },
  colRate: { width: '20%', textAlign: 'right' },
  colAmt: { width: '20%', textAlign: 'right' },
  totals: {
    marginTop: 24,
    alignSelf: 'flex-end',
    width: '45%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    color: '#3f3f46',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#a1a1aa',
    marginTop: 6,
    paddingTop: 6,
    fontWeight: 'bold',
    fontSize: 12,
  },
  note: {
    marginTop: 32,
    color: '#71717a',
    fontSize: 9,
  },
  status: {
    marginTop: 8,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#8a6d3b',
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    color: '#a1a1aa',
    fontSize: 8,
    textAlign: 'center',
  },
})

function totalsOf(
  invoice: InvoiceWithItems,
): { subtotal: number; tax: number; discount: number; total: number } {
  const subtotal = invoice.items.reduce(
    (s, i) => s + Number(i.quantity) * Number(i.unitPrice),
    0,
  )
  const tax = (subtotal * Number(invoice.taxRate)) / 100
  const discount = Number(invoice.discount)
  const total = Math.max(0, subtotal + tax - discount)
  return { subtotal, tax, discount, total }
}

function InvoicePdf({ invoice, client }: { invoice: InvoiceWithItems; client: Client }) {
  const { subtotal, tax, discount, total } = totalsOf(invoice)
  const paid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0)
  const balance = Math.max(0, total - paid)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>VANTA</Text>
            <Text style={styles.status}>{invoice.status}</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>{invoice.number}</Text>
            <Text style={styles.meta}>Issued {formatDate(invoice.issueDate)}</Text>
            <Text style={styles.meta}>Due {formatDate(invoice.dueDate)}</Text>
          </View>
        </View>

        <View style={styles.parties}>
          <View style={styles.partyBlock}>
            <Text style={styles.label}>From</Text>
            <Text style={styles.h3}>VANTA Workspace</Text>
            <Text style={styles.body}>noreply@novaworks.io</Text>
            <Text style={styles.body}>Remote · Worldwide</Text>
          </View>
          <View style={styles.partyBlock}>
            <Text style={styles.label}>Bill to</Text>
            <Text style={styles.h3}>{client.company}</Text>
            <Text style={styles.body}>{client.name}</Text>
            {client.email ? <Text style={styles.body}>{client.email}</Text> : null}
            {client.phone ? <Text style={styles.body}>{client.phone}</Text> : null}
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Description</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colRate}>Rate</Text>
          <Text style={styles.colAmt}>Amount</Text>
        </View>
        {invoice.items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colQty}>{Number(item.quantity)}</Text>
            <Text style={styles.colRate}>{fmtExact(Number(item.unitPrice))}</Text>
            <Text style={styles.colAmt}>
              {fmtExact(Number(item.quantity) * Number(item.unitPrice))}
            </Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{fmtExact(subtotal)}</Text>
          </View>
          {Number(invoice.taxRate) > 0 && (
            <View style={styles.totalRow}>
              <Text>Tax ({Number(invoice.taxRate)}%)</Text>
              <Text>{fmtExact(tax)}</Text>
            </View>
          )}
          {discount > 0 && (
            <View style={styles.totalRow}>
              <Text>Discount</Text>
              <Text>-{fmtExact(discount)}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text>Total</Text>
            <Text>{fmtExact(total)}</Text>
          </View>
          {paid > 0 && (
            <View style={styles.totalRow}>
              <Text>Amount paid</Text>
              <Text>{fmtExact(paid)}</Text>
            </View>
          )}
          {paid > 0 && (
            <View style={styles.totalRow}>
              <Text>Balance due</Text>
              <Text>{fmtExact(balance)}</Text>
            </View>
          )}
        </View>

        {invoice.note ? (
          <View style={styles.note}>
            <Text>{invoice.note}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>
          Generated by VANTA — AI business operating system
        </Text>
      </Page>
    </Document>
  )
}

export async function renderInvoicePdf(
  invoice: InvoiceWithItems,
  client: Client,
): Promise<Buffer> {
  const element = React.createElement(InvoicePdf, { invoice, client })
  return renderToBuffer(element as unknown as React.ReactElement<DocumentProps>)
}
