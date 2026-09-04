import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import AppAlert from "@/components/ui/AppAlert";
import { useTheme } from "@/context/ThemeContext";

import { useRouter } from "expo-router";
import { FileText, ArrowLeft } from "lucide-react-native";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";

import { getMyBusiness } from "@/lib/business";
import {
  getBusinessReport,
  type ReportPeriod,
} from "@/lib/reports";

/* =========================================================
   TYPES
========================================================= */

type PeriodOption = {
  key: ReportPeriod;
  label: string;
  description: string;
};

/* =========================================================
   PERIODS
========================================================= */

const PERIODS: PeriodOption[] = [
  {
    key: "daily",
    label: "Daily",
    description: "Today's business performance",
  },
  {
    key: "weekly",
    label: "Weekly",
    description: "The current week's performance",
  },
  {
    key: "monthly",
    label: "Monthly",
    description: "The current month's performance",
  },
  {
    key: "annual",
    label: "Annual",
    description: "This year's business performance",
  },
];

/* =========================================================
   DATE HELPERS
========================================================= */

function getLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getReportDates(period: ReportPeriod) {
  const today = new Date();

  if (period === "daily") {
    const date = getLocalDate(today);

    return {
      startDate: date,
      endDate: date,
    };
  }

  if (period === "weekly") {
    const start = new Date(today);
    const day = start.getDay();

    // Monday = start of week
    const daysSinceMonday = day === 0 ? 6 : day - 1;

    start.setDate(start.getDate() - daysSinceMonday);

    return {
      startDate: getLocalDate(start),
      endDate: getLocalDate(today),
    };
  }

  if (period === "monthly") {
    const start = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    return {
      startDate: getLocalDate(start),
      endDate: getLocalDate(today),
    };
  }

  const start = new Date(today.getFullYear(), 0, 1);

  return {
    startDate: getLocalDate(start),
    endDate: getLocalDate(today),
  };
}

/* =========================================================
   FORMAT HELPERS
========================================================= */

function formatMoney(value: number, currency: string) {
  return `${currency} ${value.toLocaleString()}`;
}

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);

  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* =========================================================
   BUILD PDF HTML
========================================================= */

function buildReportHtml(
  report: Awaited<ReturnType<typeof getBusinessReport>>,
  period: ReportPeriod
) {
  const periodName =
    period.charAt(0).toUpperCase() + period.slice(1);

  const money = (value: number) =>
    `${report.currency} ${value.toLocaleString()}`;

  const topProduct = report.products[0];

  const totalUnitsSold = report.products.reduce(
    (total, product) => total + product.quantity,
    0
  );

  const bestProductText = topProduct
    ? `${topProduct.productName} generated the highest product revenue at ${money(
        topProduct.revenue
      )}.`
    : "No product sales were recorded during this period.";

  const financialInsight =
    report.profit > 0
      ? `The business generated a net profit of ${money(
          report.profit
        )}, representing a ${report.profitMargin.toFixed(
          1
        )}% net profit margin.`
      : report.profit < 0
        ? `The business recorded a net loss of ${money(
            Math.abs(report.profit)
          )} during this period.`
        : "The business reached break-even during this period.";

  const salesInsight =
    report.sales > 0
      ? `${report.sales} completed sale${
          report.sales === 1 ? "" : "s"
        } generated an average transaction value of ${money(
          report.averageSale
        )}.`
      : "No completed sales were recorded during this period.";

  const productInsight =
    totalUnitsSold > 0
      ? `${totalUnitsSold.toLocaleString()} total unit${
          totalUnitsSold === 1 ? "" : "s"
        } were sold across ${report.products.length} product${
          report.products.length === 1 ? "" : "s"
        }.`
      : "No product units were recorded during this period.";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />

  <style>
    * {
      box-sizing: border-box;
    }

    .insights {
      display: grid;
      gap: 12px;
    }

    .insight {
      padding: 16px;
      background: #f8fafc;
      border-left: 4px solid #0f172a;
      border-radius: 8px;
    }

    .insight-title {
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 6px;
    }

    .insight-text {
      font-size: 13px;
      line-height: 1.5;
      color: #475569;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 0;
      padding: 40px;
      color: #0f172a;
      background: #ffffff;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 25px;
      border-bottom: 2px solid #e2e8f0;
    }

    .brand {
      font-size: 26px;
      font-weight: 700;
      color: #0f172a;
    }

    .subtitle {
      margin-top: 6px;
      font-size: 13px;
      color: #64748b;
    }

    .report-title {
      text-align: right;
    }

    .report-title h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }

    .report-title p {
      margin: 6px 0 0;
      font-size: 13px;
      color: #64748b;
    }

    .period {
      margin-top: 25px;
      padding: 16px 18px;
      background: #f8fafc;
      border-radius: 10px;
    }

    .period-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .period-value {
      margin-top: 6px;
      font-size: 15px;
      font-weight: 600;
    }

    .section-title {
      margin-top: 32px;
      margin-bottom: 14px;
      font-size: 16px;
      font-weight: 700;
    }

    .cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .card {
      padding: 20px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }

    .card-label {
      font-size: 12px;
      color: #64748b;
    }

    .card-value {
      margin-top: 8px;
      font-size: 21px;
      font-weight: 700;
    }

    .profit-card {
      background: #f8fafc;
    }

    .stats-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    .stats-table td {
      padding: 13px 8px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
    }

    .stats-table td:not(:first-child) {
      text-align: right;
      font-weight: 600;
    }

    .footer {
      margin-top: 45px;
      padding-top: 18px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>

<body>

  <div class="header">
    <div>
      <h1>${periodName} Business Report</h1>
      <div class="brand">${report.businessName}</div>
      <div class="subtitle">Business Performance Report</div>
    </div>

    <div class="report-title">
      <h1>${periodName} Report</h1>
      <p>Business Manager</p>
    </div>
  </div>

  <div class="period">
    <div class="period-label">Report Period</div>

    <div class="period-value">
      ${formatDate(report.startDate)}
      &nbsp; — &nbsp;
      ${formatDate(report.endDate)}
    </div>
  </div>

  <div class="section-title">
    Business Insights
  </div>

  <div class="insights">

    <div class="insight">
      <div class="insight-title">Financial Performance</div>
      <div class="insight-text">
        ${financialInsight}
      </div>
    </div>

    <div class="insight">
      <div class="insight-title">Sales Activity</div>
      <div class="insight-text">
        ${salesInsight}
      </div>
    </div>

    <div class="insight">
      <div class="insight-title">Product Performance</div>
      <div class="insight-text">
        ${bestProductText}
        ${productInsight}
      </div>
    </div>

  </div>

  <div class="section-title">
    Financial Overview
  </div>

  <div class="cards">

    <div class="card">
      <div class="card-label">Total Revenue</div>
      <div class="card-value">
        ${money(report.revenue)}
      </div>
    </div>

    <div class="card">
      <div class="card-label">Cost of Goods Sold</div>
      <div class="card-value">
        ${money(report.costOfGoodsSold)}
      </div>
    </div>

    <div class="card">
      <div class="card-label">Gross Profit</div>
      <div class="card-value">
        ${money(report.grossProfit)}
      </div>
    </div>

    <div class="card">
      <div class="card-label">Gross Margin</div>
      <div class="card-value">
        ${report.grossMargin.toFixed(1)}%
      </div>
    </div>

    <div class="card">
      <div class="card-label">Operating Expenses</div>
      <div class="card-value">
        ${money(report.expenses)}
      </div>
    </div>

    <div class="card profit-card">
      <div class="card-label">Net Profit</div>
      <div class="card-value">
        ${money(report.profit)}
      </div>
    </div>

    <div class="card">
      <div class="card-label">Net Profit Margin</div>
      <div class="card-value">
        ${report.profitMargin.toFixed(1)}%
      </div>
    </div>

  </div>

  <div class="section-title">
    Sales Performance
  </div>

  <table class="stats-table">

    <tr>
      <td>Completed Sales</td>
      <td>${report.sales}</td>
    </tr>

    <tr>
      <td>Average Sale</td>
      <td>${money(report.averageSale)}</td>
    </tr>

    <tr>
      <td>Total Revenue</td>
      <td>${money(report.revenue)}</td>
    </tr>

  </table>

  <div class="section-title">
    Expense & Profit Summary
  </div>

  <table class="stats-table">

    <tr>
      <td>Total Revenue</td>
      <td>${money(report.revenue)}</td>
    </tr>

    <tr>
      <td>Total Expenses</td>
      <td>${money(report.expenses)}</td>
    </tr>

    <tr>
      <td>Net Profit</td>
      <td>${money(report.profit)}</td>
    </tr>

    <tr>
      <td>Cost of Goods Sold</td>
      <td>${money(report.costOfGoodsSold)}</td>
    </tr>

    <tr>
      <td>Gross Profit</td>
      <td>${money(report.grossProfit)}</td>
    </tr>

    <tr>
      <td>Gross Margin</td>
      <td>${report.grossMargin.toFixed(1)}%</td>
    </tr>

    <tr>
      <td>Net Profit Margin</td>
      <td>${report.profitMargin.toFixed(1)}%</td>
    </tr>

  </table>

  <div class="section-title">
    Product Sales Breakdown
  </div>

  ${
    report.products.length > 0
      ? `
        <table class="stats-table">
          <tr>
            <td><strong>Product</strong></td>
            <td><strong>Qty</strong></td>
            <td><strong>Revenue</strong></td>
            <td><strong>Profit</strong></td>
          </tr>

          ${report.products
            .map(
              (product) => `
                <tr>
                  <td>${product.productName}</td>
                  <td>${product.quantity.toLocaleString()}</td>
                  <td>${money(product.revenue)}</td>
                  <td>${money(product.profit)}</td>
                </tr>
              `
            )
            .join("")}
        </table>
      `
      : `
        <div class="period">
          <div class="period-value">
            No product sales recorded for this period.
          </div>
        </div>
      `
  }

  <div class="footer">
    <span>Generated by Business Manager</span>
    <span>${new Date().toLocaleDateString()}</span>
  </div>

</body>
</html>
`;
}

/* =========================================================
   REPORTS SCREEN
========================================================= */

export default function ReportsScreen() {
  const router = useRouter();

  const { isDark } = useTheme();

  const [selectedPeriod, setSelectedPeriod] =
    useState<ReportPeriod>("monthly");

  const [generating, setGenerating] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const [alertType, setAlertType] = useState<
    "success" | "error" | "warning"
  >("success");

  /* =========================================================
     GENERATE REPORT
  ========================================================= */

  async function generateReport() {
    try {
      setGenerating(true);

      const business = await getMyBusiness();

      if (!business) {
        throw new Error("No business found.");
      }

      const { startDate, endDate } =
        getReportDates(selectedPeriod);

      const report = await getBusinessReport(
        business.id,
        startDate,
        endDate
      );

      const html = buildReportHtml(
        report,
        selectedPeriod
      );

      const { base64 } = await Print.printToFileAsync({
        html,
        base64: true,
      });

      if (!base64) {
        throw new Error("Unable to generate PDF data.");
      }

      const pdfFile = new File(
        Paths.cache,
        `Business-Report-${Date.now()}.pdf`
      );

      await pdfFile.write(base64, {
        encoding: "base64",
      });

      console.log("PDF FILE:", pdfFile.uri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfFile.uri, {
          mimeType: "application/pdf",
          dialogTitle: "Business Report",
          UTI: "com.adobe.pdf",
        });
      } else {
        showAlert(
          "success",
          "Report Generated",
          "The PDF report was generated successfully."
        );
      }
    } catch (error) {
      console.error("REPORT ERROR:", error);

      showAlert(
        "error",
        "Report Error",
        error instanceof Error
          ? error.message
          : "Unable to generate the report."
      );
    } finally {
      setGenerating(false);
    }
  }

  /* =========================================================
     ALERT
  ========================================================= */

  function showAlert(
    type: "success" | "error" | "warning",
    title: string,
    message: string
  ) {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <View
      className={`flex-1 ${
        isDark ? "bg-slate-950" : "bg-slate-50"
      }`}
    >
      {/* HEADER */}

      <View className="px-6 pb-5 pt-14">
        <Pressable
          onPress={() => router.back()}
          className={`mb-5 h-11 w-11 items-center justify-center rounded-full ${
            isDark
              ? "bg-slate-800"
              : "bg-white"
          }`}
        >
          <ArrowLeft
            size={22}
            color={isDark ? "#ffffff" : "#0f172a"}
          />
        </Pressable>

        <Text
          className={`text-3xl font-bold ${
            isDark
              ? "text-white"
              : "text-slate-950"
          }`}
        >
          Reports
        </Text>

        <Text
          className={`mt-2 text-base ${
            isDark
              ? "text-slate-400"
              : "text-slate-500"
          }`}
        >
          Generate a business performance report
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 40,
        }}
      >
        {/* REPORT PERIOD */}

        <Text
          className={`mb-3 text-sm font-semibold ${
            isDark
              ? "text-slate-400"
              : "text-slate-500"
          }`}
        >
          REPORT PERIOD
        </Text>

        <View className="gap-3">
          {PERIODS.map((period) => {
            const selected =
              selectedPeriod === period.key;

            return (
              <Pressable
                key={period.key}
                onPress={() =>
                  setSelectedPeriod(period.key)
                }
                className={`rounded-2xl border p-5 ${
                  selected
                    ? isDark
                      ? "border-white bg-white"
                      : "border-slate-950 bg-slate-950"
                    : isDark
                      ? "border-slate-800 bg-slate-900"
                      : "border-slate-200 bg-white"
                }`}
              >
                <Text
                  className={`text-lg font-bold ${
                    selected
                      ? isDark
                        ? "text-slate-950"
                        : "text-white"
                      : isDark
                        ? "text-white"
                        : "text-slate-950"
                  }`}
                >
                  {period.label}
                </Text>

                <Text
                  className={`mt-1 ${
                    selected
                      ? isDark
                        ? "text-slate-600"
                        : "text-slate-300"
                      : isDark
                        ? "text-slate-400"
                        : "text-slate-500"
                  }`}
                >
                  {period.description}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* GENERATE BUTTON */}

        <Pressable
          onPress={generateReport}
          disabled={generating}
          className={`mt-8 flex-row items-center justify-center rounded-2xl py-5 ${
            isDark
              ? "bg-white"
              : "bg-slate-950"
          } ${generating ? "opacity-60" : ""}`}
        >
          {generating ? (
            <ActivityIndicator
              color={isDark ? "#0f172a" : "#ffffff"}
            />
          ) : (
            <>
              <FileText
                size={21}
                color={
                  isDark
                    ? "#0f172a"
                    : "#ffffff"
                }
              />

              <Text
                className={`ml-3 text-base font-bold ${
                  isDark
                    ? "text-slate-950"
                    : "text-white"
                }`}
              >
                Generate PDF Report
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      {/* ALERT */}

      <AppAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
}