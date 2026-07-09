import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import styles from "../styles/ShipperDeliveryListScreenStyles";
import { getDeliveryTasks } from "../services/deliveryService";
import {
  formatCurrency,
  formatDateTime,
  getWaybillStatusLabel,
} from "../utils/pickupHelpers";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function ShipperDeliveryListScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("delivering");

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchTasks);
    return unsubscribe;
  }, [navigation]);

  const fetchTasks = async () => {
    setLoading(true);
    const result = await getDeliveryTasks();
    if (result.success) {
      setTasks(result.data || []);
    }
    setLoading(false);
  };

  const HeaderButton = ({ icon, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={styles.headerButton}
      activeOpacity={0.7}
    >
      <View style={styles.headerButtonInner}>
        <Ionicons name={icon} size={20} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );

  const InfoLine = ({ icon, children, numberOfLines }) => (
    <View style={styles.infoLine}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={15} color={PRIMARY} />
      </View>
      <Text style={styles.line} numberOfLines={numberOfLines}>
        {children}
      </Text>
    </View>
  );

  const MetaPill = ({ label, value, danger }) => (
    <View style={styles.metaPill}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={[styles.metaValue, danger && styles.metaValueDanger]}>
        {value}
      </Text>
    </View>
  );

  const renderItem = ({ item }) => {
    const statusLabel = getWaybillStatusLabel(
      item.status || item.waybill_status,
    );

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("ShipperDeliveryDetail", {
            waybillCode: item.waybill_code,
          })
        }
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.codeBlock}>
            <Text style={styles.code}>{item.waybill_code}</Text>
            <Text style={styles.sub}>Giao cho khách hàng</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.status}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <InfoLine icon="person">
            Người nhận:{" "}
            <Text style={{ fontWeight: "700", color: "#0F172A" }}>
              {item.receiver_name || "---"}
            </Text>
          </InfoLine>

          <InfoLine icon="location" numberOfLines={2}>
            Địa chỉ:{" "}
            <Text style={{ fontWeight: "700", color: "#0F172A" }}>
              {item.receiver_address || "---"}
            </Text>
          </InfoLine>

          <InfoLine icon="time-outline">
            Hẹn giao:{" "}
            <Text style={{ fontWeight: "700", color: "#0F172A" }}>
              {formatDateTime(item.requested_pickup_time || item.created_at)}
            </Text>
          </InfoLine>
        </View>

        <View style={styles.metaRow}>
          <MetaPill
            label="COD"
            value={formatCurrency(item.cod_amount)}
            danger
          />
          <MetaPill
            label="Cước phí"
            value={formatCurrency(
              item.total_amount_to_collect ||
                item.final_total_amount ||
                item.estimated_total_amount,
            )}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER CHUẨN FORM */}
      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Đơn giao hàng</Text>
          <Text style={styles.headerSub}>Giao tận tay khách hàng</Text>
        </View>
        <HeaderButton icon="reload" onPress={fetchTasks} />
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
        <TouchableOpacity
          style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'delivering' ? PRIMARY : 'transparent' }}
          onPress={() => setActiveTab('delivering')}
        >
          <Text style={{ fontWeight: activeTab === 'delivering' ? '700' : '500', color: activeTab === 'delivering' ? PRIMARY : '#64748B' }}>Đang giao</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'failed' ? PRIMARY : 'transparent' }}
          onPress={() => setActiveTab('failed')}
        >
          <Text style={{ fontWeight: activeTab === 'failed' ? '700' : '500', color: activeTab === 'failed' ? PRIMARY : '#64748B' }}>Giao thất bại</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (() => {
        const filteredTasks = tasks.filter(t => activeTab === 'delivering' ? (t.status !== 'DELIVERY_FAILED' && t.status !== 'CUSTOMER_UNAVAILABLE') : (t.status === 'DELIVERY_FAILED' || t.status === 'CUSTOMER_UNAVAILABLE'));
        return filteredTasks.length === 0 ? (
          <View style={styles.center}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="car-outline" size={36} color="#94A3B8" />
            </View>
            <Text style={styles.emptyText}>Hiện chưa có đơn giao nào.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTasks}
            keyExtractor={(item) => item.waybill_code}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        );
      })()}
    </View>
  );
}

// STYLES CHUẨN DNA
// styles moved to ../styles/ShipperDeliveryListScreenStyles
