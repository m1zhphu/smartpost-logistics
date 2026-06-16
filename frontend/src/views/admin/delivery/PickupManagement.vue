<template>
  <div class="modern-pickup-page animate-fade-in">
    <div class="page-container">
      
      <!-- Page Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="title-wrapper">
            <div class="icon-box primary">
              <el-icon><Location /></el-icon>
            </div>
            <div>
              <h2 class="page-title">Điều phối lấy hàng</h2>
              <p class="page-subtitle">Xác nhận văn phòng, điều phối bưu tá và xác nhận kết quả lấy hàng online/hotline</p>
            </div>
          </div>
        </div>
        <div class="header-actions flex gap-2">
          <el-button type="success" @click="handleRefresh" :loading="loading" plain>
            <el-icon class="mr-2"><Refresh /></el-icon>
            <span>Làm mới</span>
          </el-button>
        </div>
      </header>

      <!-- Main Content Card -->
      <div class="content-card">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          
          <!-- TAB 1: CHỜ XÁC NHẬN VĂN PHÒNG -->
          <el-tab-pane name="pending" v-if="authStore.user?.role_id === 1">
            <template #label>
              <div class="flex-center gap-2">
                <el-badge :value="pendingRequests.length" :hidden="pendingRequests.length === 0" type="danger">
                  <span>Chờ xác nhận văn phòng</span>
                </el-badge>
              </div>
            </template>

            <div class="flex-between mb-4">
              <div class="card-header-actions">
                <el-button 
                  type="primary" 
                  :disabled="multipleSelection.length === 0" 
                  @click="openConfirmHubDialog"
                >
                  <el-icon class="mr-2"><OfficeBuilding /></el-icon>
                  <span>Điều phối Hub ({{ multipleSelection.length }} đơn)</span>
                </el-button>
              </div>
              <div class="search-wrapper">
                <el-input 
                  v-model="searchPending" 
                  placeholder="Tìm mã, SĐT, địa chỉ..." 
                  class="modern-input-small"
                  clearable
                >
                  <template #prefix><el-icon><Search /></el-icon></template>
                </el-input>
              </div>
            </div>

            <div class="pickup-table-scroll">
              <el-table 
                style="width: 100%; min-width: 1250px;"
                :data="groupedPending" 
                v-loading="loading" 
                class="modern-table" 
                stripe
              >
                <el-table-column type="expand">
                  <template #default="{ row }">
                    <div style="padding: 15px 30px; background-color: #f8fafc; border-radius: 8px; margin: 10px;">
                      <h4 style="margin-bottom: 12px; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                        <el-icon><List /></el-icon> Danh sách đơn chi tiết ({{ row.requests.length }} đơn)
                      </h4>
                      <div class="inner-table-scroll">
                        <el-table
                          style="width: 100%; min-width: 1200px;"
                          :data="row.requests"
                          class="modern-table inner-table"
                          size="small"
                          border
                          stripe
                          row-key="request_id"
                          @selection-change="selection => handlePendingRequestSelectionChange(row, selection)"
                        >
                      <el-table-column type="selection" width="48" align="center" :reserve-selection="true" />
                      <el-table-column prop="request_code" label="Mã Yêu Cầu" width="160">
                        <template #default="scope">
                          <el-link type="warning" class="fw-bold" @click="viewRequestDetails(scope.row)">
                            {{ scope.row.request_code }}
                          </el-link>
                        </template>
                      </el-table-column>
                      <el-table-column label="Mã Vận Đơn" min-width="210">
                        <template #default="scope">
                          <div v-if="getWaybillCodes(scope.row).length" class="waybill-chip-list">
                            <span
                              v-for="code in getWaybillCodes(scope.row)"
                              :key="code"
                              class="code-badge info text-xs"
                              style="background: rgba(67, 24, 255, 0.1); color: #4318ff;"
                            >
                              {{ code }}
                            </span>
                          </div>
                          <span v-else class="text-muted text-xs">Chưa có</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="Mã Khách Hàng" width="130">
                        <template #default="scope">
                          <span class="text-xs">{{ scope.row.customer_code || scope.row.customer_id || '---' }}</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="Túi Pickup" width="150" show-overflow-tooltip>
                        <template #default="scope">
                          <span v-if="scope.row.bag_code" class="code-badge text-xs" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
                            {{ scope.row.bag_code }}
                          </span>
                          <span v-else class="text-muted text-xs">---</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="Đơn/Túi" width="90" align="center">
                        <template #default="scope">
                          <span v-if="scope.row.bag_code" class="text-xs fw-bold">{{ getBagItemCount(scope.row) }} đơn</span>
                          <span v-else class="text-muted text-xs">---</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="Tổng cân túi" width="110" align="center">
                        <template #default="scope">
                          <span v-if="scope.row.bag_code" class="text-xs fw-bold">{{ scope.row.total_estimated_weight }} kg</span>
                          <span v-else class="text-muted text-xs">---</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="Lý do từ chối" min-width="150" show-overflow-tooltip>
                        <template #default="scope">
                          <span v-if="scope.row.status === 'HUB_REJECTED'" class="text-danger text-xs">
                            ❌ {{ scope.row.rejection_note || 'Bị từ chối' }}
                          </span>
                          <span v-else class="text-muted text-xs">---</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="Thao tác" width="120" align="center">
                        <template #default="scope">
                          <el-button type="info" size="small" plain @click="viewRequestDetails(scope.row)">Chi tiết</el-button>
                        </template>
                      </el-table-column>
                        </el-table>
                      </div>
                    </div>
                  </template>
                </el-table-column>
              
              <el-table-column label="Khách hàng / Shop" min-width="200">
                <template #default="{ row }">
                  <div class="sender-info">
                    <span class="fw-bold text-dark">
                      {{ row.customer_name }}
                      <span class="text-xs text-muted" v-if="row.customer_code">({{ row.customer_code }})</span>
                    </span>
                    <span class="text-xs text-muted"><el-icon class="mr-1"><Phone /></el-icon>{{ row.customer_phone }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="Nguồn" width="110" align="center">
                <template #default="{ row }">
                  <el-tag :type="getSourceTagType(row.source)" effect="dark" size="small" class="fw-bold">{{ row.source }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Địa chỉ lấy hàng" min-width="320" prop="pickup_address" />
              <el-table-column label="Tổng số đơn" width="120" align="center">
                <template #default="{ row }">
                  <el-tag type="warning" effect="dark" size="large" style="font-weight: bold; font-size: 14px;">{{ row.requests.length }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Tổng khối lượng" width="140" align="center">
                <template #default="{ row }">
                  <span class="fw-bold" style="color: #4318ff;">{{ row.total_weight.toFixed(1) }} kg</span>
                </template>
              </el-table-column>
              
              <template #empty>
                <el-empty description="Không có yêu cầu nào chờ xác nhận văn phòng" :image-size="100" />
              </template>
            </el-table>
          </div>
          </el-tab-pane>

          <!-- TAB NEW: CHỜ BƯU CỤC XÁC NHẬN (DISPATCHED_TO_HUB) -->
          <el-tab-pane name="dispatch-hub">
            <template #label>
              <div class="flex-center gap-2">
                <el-badge :value="dispatchRequests.length" :hidden="dispatchRequests.length === 0" type="warning">
                  <span>Chờ bưu cục xác nhận</span>
                </el-badge>
              </div>
            </template>

            <div class="flex-between mb-4">
              <div class="flex items-center gap-2">
                <el-select 
                  v-if="authStore.user?.role_id === 1" 
                  v-model="selectedHubId" 
                  placeholder="Chọn bưu cục để xem đơn" 
                  filterable 
                  class="modern-input-small w-[250px]"
                  @change="() => fetchTabRequests('dispatch-hub')"
                >
                  <el-option label="Tất cả bưu cục" :value="null" />
                  <el-option v-for="h in hubs" :key="h.hub_id" :label="h.hub_name" :value="h.hub_id" />
                </el-select>

                <el-button 
                  type="success" 
                  :disabled="dispatchSelection.length === 0" 
                  @click="handleBulkAcceptDispatch"
                >
                  <el-icon class="mr-1"><Check /></el-icon>
                  <span>Chấp nhận hàng loạt ({{ dispatchSelection.length }} đơn)</span>
                </el-button>
                
                <el-button 
                  type="danger" 
                  :disabled="dispatchSelection.length === 0" 
                  @click="openBulkRejectDialog"
                >
                  <el-icon class="mr-1"><Close /></el-icon>
                  <span>Từ chối hàng loạt ({{ dispatchSelection.length }} đơn)</span>
                </el-button>
              </div>
              <div class="search-wrapper">
                <el-input 
                  v-model="searchDispatch" 
                  placeholder="Tìm mã, SĐT, địa chỉ..." 
                  class="modern-input-small"
                  clearable
                >
                  <template #prefix><el-icon><Search /></el-icon></template>
                </el-input>
              </div>
            </div>

            <div class="pickup-table-scroll">
              <el-table 
                style="width: 100%; min-width: 1250px;"
                :data="groupedDispatch" 
                v-loading="loading" 
                class="modern-table" 
                stripe
              >
                <el-table-column type="expand">
                  <template #default="{ row }">
                    <div style="padding: 15px 30px; background-color: #f8fafc; border-radius: 8px; margin: 10px;">
                      <h4 style="margin-bottom: 12px; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                        <el-icon><List /></el-icon> Danh sách đơn chi tiết đang điều phối ({{ row.requests.length }} đơn)
                      </h4>
                      <div class="inner-table-scroll">
                        <el-table 
                          style="width: 100%; min-width: 1200px;"
                          :data="row.requests" 
                          class="modern-table inner-table" 
                          size="small" 
                          border 
                          stripe
                          row-key="request_id"
                          @selection-change="selection => handleDispatchRequestSelectionChange(row, selection)"
                        >
                      <el-table-column type="selection" width="48" align="center" :reserve-selection="true" />
                      <el-table-column prop="request_code" label="Mã Yêu Cầu" width="160">
                        <template #default="scope">
                          <el-link type="warning" class="fw-bold" @click="viewRequestDetails(scope.row)">
                            {{ scope.row.request_code }}
                          </el-link>
                        </template>
                      </el-table-column>
                      <el-table-column label="Mã Vận Đơn" min-width="210">
                        <template #default="scope">
                          <div v-if="getWaybillCodes(scope.row).length" class="waybill-chip-list">
                            <span
                              v-for="code in getWaybillCodes(scope.row)"
                              :key="code"
                              class="code-badge info text-xs"
                              style="background: rgba(67, 24, 255, 0.1); color: #4318ff;"
                            >
                              {{ code }}
                            </span>
                          </div>
                          <span v-else class="text-muted text-xs">Chưa có</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="Khách hàng" width="120" show-overflow-tooltip>
                        <template #default="scope">
                          <span class="text-xs">{{ scope.row.customer_code || scope.row.customer_id || '---' }}</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="Túi Pickup" width="150" show-overflow-tooltip>
                        <template #default="scope">
                          <span v-if="scope.row.bag_code" class="code-badge text-xs" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
                            {{ scope.row.bag_code }}
                          </span>
                          <span v-else class="text-muted text-xs">---</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="Đơn/Túi" width="90" align="center">
                        <template #default="scope">
                          <span v-if="scope.row.bag_code" class="text-xs fw-bold">{{ getBagItemCount(scope.row) }} đơn</span>
                          <span v-else class="text-muted text-xs">---</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="Trọng lượng túi" width="120" align="center">
                        <template #default="scope">
                          <span v-if="scope.row.bag_code" class="text-xs fw-bold">{{ scope.row.total_estimated_weight }} kg</span>
                          <span v-else class="text-muted text-xs">---</span>
                        </template>
                      </el-table-column>
                      <el-table-column prop="dispatch_note" label="Ghi chú điều phối" min-width="150" show-overflow-tooltip />
                      <el-table-column label="Ngày điều phối" width="140" align="center">
                        <template #default="scope">
                          <span class="text-xs">{{ formatDate(scope.row.dispatched_at) }}</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="Thao tác" width="220" align="center">
                        <template #default="scope">
                          <div class="flex justify-center gap-2">
                            <el-button type="success" size="small" plain @click="handleAcceptDispatch(scope.row)">
                              <el-icon class="mr-1"><Check /></el-icon> Chấp nhận
                            </el-button>
                            <el-button type="danger" size="small" plain @click="openRejectDialog(scope.row)">
                              <el-icon class="mr-1"><Close /></el-icon> Từ chối
                            </el-button>
                          </div>
                        </template>
                      </el-table-column>
                        </el-table>
                      </div>
                    </div>
                  </template>
                </el-table-column>
              
              <el-table-column label="Khách hàng / Shop" min-width="200">
                <template #default="{ row }">
                  <div class="sender-info">
                    <span class="fw-bold text-dark">
                      {{ row.customer_name }}
                      <span class="text-xs text-muted" v-if="row.customer_code">({{ row.customer_code }})</span>
                    </span>
                    <span class="text-xs text-muted"><el-icon class="mr-1"><Phone /></el-icon>{{ row.customer_phone }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="Nguồn" width="110" align="center">
                <template #default="{ row }">
                  <el-tag :type="getSourceTagType(row.source)" effect="dark" size="small" class="fw-bold">{{ row.source }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Địa chỉ lấy hàng" min-width="320" prop="pickup_address" />
              <el-table-column label="Tổng số đơn" width="120" align="center">
                <template #default="{ row }">
                  <el-tag type="warning" effect="dark" size="large" style="font-weight: bold; font-size: 14px;">{{ row.requests.length }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Tổng khối lượng" width="140" align="center">
                <template #default="{ row }">
                  <span class="fw-bold" style="color: #4318ff;">{{ row.total_weight.toFixed(1) }} kg</span>
                </template>
              </el-table-column>
              <el-table-column label="Thao tác chung" min-width="310" align="center">
                <template #default="{ row }">
                  <div class="flex justify-center gap-2">
                    <el-button type="success" size="small" @click="handleGroupAcceptDispatch(row)">
                      <el-icon class="mr-1"><Check /></el-icon> Tiếp nhận tất cả
                    </el-button>
                    <el-button type="danger" size="small" @click="openGroupRejectDialog(row)">
                      <el-icon class="mr-1"><Close /></el-icon> Từ chối tất cả
                    </el-button>
                  </div>
                </template>
              </el-table-column>
              
              <template #empty>
                <el-empty description="Không có yêu cầu nào đang chờ bưu cục xác nhận" :image-size="100" />
              </template>
            </el-table>
          </div>
          </el-tab-pane>

          <!-- TAB 2: ĐÃ TIẾP NHẬN & CHỜ GÁN BƯU TÁ -->
          <el-tab-pane name="received">
            <template #label>
              <div class="flex-center gap-2">
                <el-badge :value="receivedRequests.length" :hidden="receivedRequests.length === 0" type="primary">
                  <span>Chờ gán bưu tá</span>
                </el-badge>
              </div>
            </template>

            <div class="flex-between mb-4">
              <div class="flex items-center gap-2">
                <el-select 
                  v-if="authStore.user?.role_id === 1" 
                  v-model="selectedHubId" 
                  placeholder="Chọn bưu cục để xem đơn" 
                  filterable 
                  class="modern-input-small w-[250px]"
                  @change="() => fetchTabRequests('received')"
                >
                  <el-option label="Tất cả bưu cục" :value="null" />
                  <el-option v-for="h in hubs" :key="h.hub_id" :label="h.hub_name" :value="h.hub_id" />
                </el-select>

                <el-button 
                  type="primary" 
                  :disabled="receivedSelection.length === 0" 
                  @click="openBulkAssignShipperDialog"
                >
                  <el-icon class="mr-1"><Bicycle /></el-icon>
                  <span>Gán bưu tá hàng loạt ({{ receivedSelection.length }} đơn)</span>
                </el-button>
              </div>
              <div class="search-wrapper">
                <el-input 
                  v-model="searchReceived" 
                  placeholder="Tìm mã, SĐT, địa chỉ..." 
                  class="modern-input-small"
                  clearable
                >
                  <template #prefix><el-icon><Search /></el-icon></template>
                </el-input>
              </div>
            </div>

            <div class="pickup-table-scroll">
              <el-table 
                style="width: 100%; min-width: 1250px;"
                :data="groupedReceived" 
                v-loading="loading" 
                class="modern-table" 
                stripe
              >
                <el-table-column type="expand">
                  <template #default="{ row }">
                    <div style="padding: 15px 30px; background-color: #f8fafc; border-radius: 8px; margin: 10px;">
                      <h4 style="margin-bottom: 12px; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                        <el-icon><List /></el-icon> Danh sách đơn chi tiết chờ lấy ({{ row.requests.length }} đơn)
                      </h4>
                      <div class="inner-table-scroll">
                        <el-table 
                          style="width: 100%; min-width: 1200px;"
                          :data="row.requests" 
                          class="modern-table inner-table" 
                          size="small" 
                          border 
                          stripe
                          row-key="request_id"
                          @selection-change="selection => handleReceivedRequestSelectionChange(row, selection)"
                        >
                          <el-table-column type="selection" width="48" align="center" :reserve-selection="true" />
                          <el-table-column prop="request_code" label="Mã Yêu Cầu" width="160">
                            <template #default="scope">
                              <el-link type="success" class="fw-bold" @click="viewRequestDetails(scope.row)">
                                {{ scope.row.request_code }}
                              </el-link>
                            </template>
                          </el-table-column>
                          <el-table-column label="Mã Vận Đơn" min-width="210">
                            <template #default="scope">
                              <div v-if="getWaybillCodes(scope.row).length" class="waybill-chip-list">
                                <span
                                  v-for="code in getWaybillCodes(scope.row)"
                                  :key="code"
                                  class="code-badge info text-xs"
                                  style="background: rgba(67, 24, 255, 0.1); color: #4318ff;"
                                >
                                  {{ code }}
                                </span>
                              </div>
                              <span v-else class="text-muted text-xs">Chưa có</span>
                            </template>
                          </el-table-column>
                          <el-table-column label="Văn phòng nhận" width="150" show-overflow-tooltip>
                            <template #default="scope">
                              <span class="fw-bold text-primary">{{ scope.row.target_hub_name || getHubName(scope.row.target_hub_id) || 'N/A' }}</span>
                            </template>
                          </el-table-column>
                          <el-table-column prop="notes" label="Ghi chú khách" min-width="120" show-overflow-tooltip />
                          <el-table-column label="Thao tác" width="220" align="center">
                            <template #default="scope">
                              <div class="flex justify-center gap-2">
                                <el-button type="info" size="small" plain @click="viewRequestDetails(scope.row)">Chi tiết</el-button>
                                <el-button type="primary" size="small" plain @click="openAssignShipperDialog(scope.row)">
                                  <el-icon class="mr-1"><Bicycle /></el-icon> Gán bưu tá
                                </el-button>
                              </div>
                            </template>
                          </el-table-column>
                        </el-table>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                
                <el-table-column label="Khách hàng / Shop" min-width="200">
                  <template #default="{ row }">
                    <div class="sender-info">
                      <span class="fw-bold text-dark">
                        {{ row.customer_name }}
                        <span class="text-xs text-muted" v-if="row.customer_code">({{ row.customer_code }})</span>
                      </span>
                      <span class="text-xs text-muted"><el-icon class="mr-1"><Phone /></el-icon>{{ row.customer_phone }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="Nguồn" width="110" align="center">
                  <template #default="{ row }">
                    <el-tag :type="getSourceTagType(row.source)" effect="dark" size="small" class="fw-bold">{{ row.source }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="Địa chỉ lấy hàng" min-width="320" prop="pickup_address" />
                <el-table-column label="Tổng số đơn" width="120" align="center">
                  <template #default="{ row }">
                    <el-tag type="primary" effect="dark" size="large" style="font-weight: bold; font-size: 14px;">{{ row.requests.length }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="Tổng khối lượng" width="140" align="center">
                  <template #default="{ row }">
                    <span class="fw-bold" style="color: #4318ff;">{{ row.total_weight.toFixed(1) }} kg</span>
                  </template>
                </el-table-column>
                <el-table-column label="Thao tác chung" min-width="200" align="center">
                  <template #default="{ row }">
                    <el-button type="primary" size="small" @click="openGroupAssignShipperDialog(row)">
                      <el-icon class="mr-1"><Bicycle /></el-icon> Gán bưu tá tất cả
                    </el-button>
                  </template>
                </el-table-column>

                <template #empty>
                  <el-empty description="Không có yêu cầu lấy hàng nào tại văn phòng của bạn" :image-size="100" />
                </template>
              </el-table>
            </div>
          </el-tab-pane>

          <!-- TAB 3: ĐANG ĐI LẤY -->
          <el-tab-pane name="assigned">
            <template #label>
              <div class="flex-center gap-2">
                <el-badge :value="assignedRequests.length" :hidden="assignedRequests.length === 0" type="info">
                  <span>Đang đi lấy</span>
                </el-badge>
              </div>
            </template>

            <div class="flex-between mb-4">
              <div>
                <el-select 
                  v-if="authStore.user?.role_id === 1" 
                  v-model="selectedHubId" 
                  placeholder="Chọn bưu cục để xem đơn" 
                  filterable 
                  class="modern-input-small w-[250px]"
                  @change="() => fetchTabRequests('assigned')"
                >
                  <el-option label="Tất cả bưu cục" :value="null" />
                  <el-option v-for="h in hubs" :key="h.hub_id" :label="h.hub_name" :value="h.hub_id" />
                </el-select>
              </div>
              <div class="search-wrapper">
                <el-input 
                  v-model="searchAssigned" 
                  placeholder="Tìm mã, SĐT, bưu tá..." 
                  class="modern-input-small"
                  clearable
                >
                  <template #prefix><el-icon><Search /></el-icon></template>
                </el-input>
              </div>
            </div>

            <div class="pickup-table-scroll">
              <el-table 
                style="width: 100%; min-width: 1250px;"
                :data="filteredAssigned" 
                v-loading="loading" 
                class="modern-table" 
                stripe
              >
              <el-table-column prop="request_code" label="Mã Yêu Cầu" width="160">
                <template #default="{ row }">
                  <div class="flex flex-col gap-1">
                    <el-link type="info" class="fw-bold" style="font-size: 13px;" @click="viewRequestDetails(row)">
                      {{ row.request_code }}
                    </el-link>
                    <span v-if="getWaybillCode(row)" class="code-badge info text-xs" style="background: rgba(67, 24, 255, 0.1); color: #4318ff; display: inline-block; width: max-content;">
                      {{ getWaybillCode(row) }}
                    </span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="Người gửi / Shop" min-width="160">
                <template #default="{ row }">
                  <div class="sender-info">
                    <span class="fw-bold text-dark">
                      {{ getCustomerName(row) }}
                      <span class="text-xs text-muted" v-if="row.customer_code">({{ row.customer_code }})</span>
                    </span>
                    <span class="text-xs text-muted"><el-icon class="mr-1"><Phone /></el-icon>{{ row.sender_phone }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="Địa chỉ lấy hàng" min-width="320">
                <template #default="{ row }">
                  <span class="address-text">{{ row.pickup_address }}</span>
                </template>
              </el-table-column>
              <el-table-column label="Bưu tá phụ trách" width="180">
                <template #default="{ row }">
                  <div class="flex-center gap-2" v-if="row.assigned_shipper_name">
                    <el-avatar :size="24" class="bg-primary text-white text-xs fw-bold">{{ row.assigned_shipper_name.charAt(0) }}</el-avatar>
                    <span class="fw-semibold text-dark text-xs">{{ row.assigned_shipper_name }}</span>
                  </div>
                  <span v-else class="text-muted text-xs">Chưa rõ</span>
                </template>
              </el-table-column>
              <el-table-column label="Ngày gán" width="150" align="center">
                <template #default="{ row }">
                  <span class="text-xs">{{ formatDate(row.pickup_assigned_at || row.created_at) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="Thao tác" width="260" align="center">
                <template #default="{ row }">
                  <div class="flex justify-center gap-2">
                    <el-button 
                      type="info" 
                      size="small" 
                      plain
                      @click="viewRequestDetails(row)"
                    >
                      Chi tiết
                    </el-button>
                    <el-button 
                      type="success" 
                      size="small" 
                      @click="openPickedDialog(row)"
                    >
                      <el-icon class="mr-1"><Check /></el-icon>
                      <span>Xác nhận đã lấy</span>
                    </el-button>
                  </div>
                </template>
              </el-table-column>
              <template #empty>
                <el-empty description="Không có đơn hàng nào đang trong quá trình đi lấy" :image-size="100" />
              </template>
            </el-table>
          </div>
          </el-tab-pane>

        </el-tabs>
      </div>



      <!-- Dispatch Hub Dialog (Tab 1) -->
      <el-dialog 
        v-model="confirmHubVisible" 
        title="Điều phối Văn phòng nhận hàng (Hub)" 
        width="450px"
        destroy-on-close
      >
        <div class="dialog-form" v-loading="dialogLoading">
          <div class="dialog-form-item">
            <label>CHỌN VĂN PHÒNG NHẬN (HUB)</label>
            <el-select 
              v-model="selectedHubId" 
              placeholder="Chọn bưu cục nhận..." 
              filterable 
              class="dialog-select"
            >
              <el-option 
                v-for="hub in hubs" 
                :key="hub.hub_id" 
                :label="hub.hub_code + ' - ' + hub.hub_name" 
                :value="hub.hub_id" 
              />
            </el-select>
          </div>
          <div class="dialog-form-item">
            <label>GHI CHÚ ĐIỀU PHỐI</label>
            <el-input 
              v-model="hubConfirmNote" 
              type="textarea" 
              :rows="3" 
              placeholder="Nhập ghi chú điều phối cho bưu cục..." 
              resize="none" 
            />
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <el-button @click="confirmHubVisible = false">Hủy</el-button>
            <el-button type="primary" :disabled="!selectedHubId || dialogLoading" @click="submitConfirmHub">
              Điều phối
            </el-button>
          </div>
        </template>
      </el-dialog>

      <!-- Dialog: Từ chối Điều phối (Tab Dispatch Hub) -->
      <el-dialog 
        v-model="rejectDialogVisible" 
        :title="rejectForm.request_codes.length > 1 ? 'Từ chối điều phối hàng loạt yêu cầu lấy hàng' : 'Từ chối điều phối yêu cầu lấy hàng'" 
        width="450px"
        destroy-on-close
      >
        <div class="dialog-form" v-loading="dialogLoading">
          <div class="mb-4">
            <div class="text-xs text-muted mb-2">ĐƠN PICKUP:</div>
            <div class="fw-bold text-dark mb-2">
              <span v-if="rejectForm.request_codes.length > 1">
                Đã chọn {{ rejectForm.request_codes.length }} đơn cần từ chối
              </span>
              <span v-else-if="rejectForm.request_codes.length === 1">
                {{ rejectForm.request_codes[0] }}
              </span>
            </div>
          </div>
          <div class="dialog-form-item">
            <label>LÝ DO TỪ CHỐI (BẮT BUỘC)</label>
            <el-input 
              v-model="rejectForm.note" 
              type="textarea" 
              :rows="3" 
              placeholder="Nhập lý do từ chối cụ thể..." 
              resize="none" 
            />
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <el-button @click="rejectDialogVisible = false">Hủy</el-button>
            <el-button type="danger" :disabled="!rejectForm.note.trim() || dialogLoading" @click="submitRejectDispatch">
              Từ chối điều phối
            </el-button>
          </div>
        </template>
      </el-dialog>

      <!-- Assign Shipper Dialog (Tab 2) -->
      <el-dialog 
        v-model="assignShipperVisible" 
        title="Phân công Bưu tá đi lấy hàng" 
        width="450px"
        destroy-on-close
      >
        <div v-if="selectedRequest" class="dialog-form" v-loading="dialogLoading">
          <div class="mb-4">
            <div class="text-xs text-muted mb-2">ĐƠN PICKUP:</div>
            <div class="fw-bold text-dark mb-2">{{ selectedRequest.request_code }}</div>
            <div class="text-xs text-muted mb-2">ĐỊA CHỈ LẤY:</div>
            <div style="font-size: 13px; line-height: 1.4; color: #1e293b;" class="mb-2">
              {{ selectedRequest.pickup_address }}
            </div>
          </div>
          <div class="dialog-form-item">
            <label>CHỌN BƯU TÁ (SHIPPER)</label>
            <el-select 
              v-model="selectedShipperId" 
              placeholder="Chọn bưu tá lấy hàng..." 
              filterable 
              class="dialog-select"
            >
              <el-option 
                v-for="shipper in shippers" 
                :key="shipper.user_id" 
                :label="shipper.full_name + ' (' + (shipper.is_online ? 'Hoạt động' : 'Ngoại tuyến') + ' - ' + shipper.phone + ')'" 
                :value="shipper.user_id" 
                :disabled="!shipper.is_online"
              />
            </el-select>
          </div>
          <div class="dialog-form-item">
            <label>GHI CHÚ GIAO VIỆC</label>
            <el-input 
              v-model="shipperAssignNote" 
              type="textarea" 
              :rows="3" 
              placeholder="Ví dụ: Gọi trước khi đến, lấy hàng trước 5h chiều..." 
              resize="none" 
            />
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <el-button @click="assignShipperVisible = false">Hủy</el-button>
            <el-button type="primary" :disabled="!selectedShipperId || dialogLoading" @click="submitAssignShipper">
              Giao việc
            </el-button>
          </div>
        </template>
      </el-dialog>

      <!-- Dialog: Xác Nhận Đã Lấy Hàng Thành Công -->
      <el-dialog 
        v-model="pickedDialogVisible" 
        title="Xác nhận lấy hàng thành công (Hồ sơ biên nhận)" 
        width="520px"
        destroy-on-close
      >
        <el-form :model="pickedForm" label-position="top" v-loading="dialogLoading">
          <el-form-item label="MÃ YÊU CẦU PICKUP">
            <el-input v-model="pickedForm.request_code" disabled class="fw-bold" />
          </el-form-item>
          
          <el-form-item required>
            <template #label>
              <span>ẢNH BIÊN NHẬN THỰC ĐỊA (BẮT BUỘC)</span>
              <span class="text-xs text-muted ml-2">(Tối đa 5 ảnh)</span>
            </template>
            <!-- Gallery ảnh đã upload -->
            <div v-if="pickedForm.pickup_image_urls.length > 0" class="pickup-batch-gallery mb-2">
              <div
                v-for="(imgUrl, idx) in pickedForm.pickup_image_urls"
                :key="'batch-' + idx"
                class="pickup-batch-thumb"
              >
                <img :src="getFullImageUrl(imgUrl)" class="receipt-preview-sm" />
                <button class="remove-thumb-btn" @click.prevent="removePickupImage(idx)">
                  <el-icon><Close /></el-icon>
                </button>
                <span v-if="idx === 0" class="thumb-label-first">Chính</span>
              </div>
            </div>
            <!-- Upload button —hiện khi chưa đủ 5 ảnh -->
            <div v-if="pickedForm.pickup_image_urls.length < 5" class="upload-container border-dashed p-3 rounded text-center">
              <el-upload
                class="receipt-uploader"
                :action="batchPickupUploadUrl"
                :headers="uploadHeaders"
                name="files"
                multiple
                :limit="5 - pickedForm.pickup_image_urls.length"
                :show-file-list="false"
                :on-success="handleBatchUploadSuccess"
                :before-upload="beforeUploadBatch"
                v-loading="uploadLoading"
                accept="image/*"
              >
                <div class="upload-placeholder">
                  <el-icon class="receipt-uploader-icon"><Plus /></el-icon>
                  <div class="text-xs text-muted mt-1">
                    {{ pickedForm.pickup_image_urls.length === 0 ? 'Nhấp để chọn ảnh biên nhận' : `Thêm ảnh (còn ${5 - pickedForm.pickup_image_urls.length} slot)` }}
                  </div>
                </div>
              </el-upload>
            </div>
            <div class="helper-text mt-1">Chỉ chấp nhận JPG/PNG dung lượng dưới 5MB mỗi ảnh.</div>
          </el-form-item>

          <el-form-item label="GHI CHÚ XÁC NHẬN">
            <el-input 
              v-model="pickedForm.note" 
              type="textarea" 
              :rows="3" 
              placeholder="Nhập thông tin xác nhận như số lượng thực tế, người giao..." 
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="flex justify-end gap-2">
            <el-button @click="pickedDialogVisible = false">Hủy</el-button>
            <el-button type="success" :disabled="!pickedForm.pickup_image_urls.length || dialogLoading" @click="submitPicked">
              Đã Lấy Hàng
            </el-button>
          </div>
        </template>
      </el-dialog>

      <!-- Dialog: Chi tiết yêu cầu lấy hàng -->
      <el-dialog 
        v-model="detailDialogVisible" 
        title="Chi tiết yêu cầu lấy hàng" 
        width="750px"
        destroy-on-close
      >
        <div v-if="selectedRequest" class="detail-dialog-content" v-loading="detailLoading">
          <!-- Header Status Cards -->
          <div class="flex justify-between items-center mb-4 p-3 rounded" style="background: var(--bg-hover, #f8fafc);">
            <div>
              <span class="text-xs text-muted block mb-1">MÃ YÊU CẦU</span>
              <strong class="text-lg text-primary" style="color: var(--sp-primary, #4318ff);">{{ selectedRequest.request_code }}</strong>
            </div>
            <div class="text-right">
              <span class="text-xs text-muted block mb-1">TRẠNG THÁI</span>
              <el-tag :type="getStatusTagType(selectedRequest.status)" effect="dark" class="fw-bold">
                {{ getStatusLabel(selectedRequest.status) }}
              </el-tag>
            </div>
          </div>

          <el-tabs v-model="detailActiveTab">
            <el-tab-pane label="Thông tin chung" name="info">
              <!-- Row 1: Người gửi & Người nhận -->
              <el-row :gutter="20" class="mt-2">
                <el-col :span="12">
                  <h4 class="section-title"><el-icon class="mr-1"><User /></el-icon> Thông tin người gửi</h4>
                  <div class="info-card">
                    <div class="info-row">
                      <span class="label">Khách hàng:</span>
                      <span class="value fw-bold">{{ getCustomerName(selectedRequest) }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Mã khách:</span>
                      <span class="value">{{ selectedRequest.customer_code || 'Khách vãng lai' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Số điện thoại:</span>
                      <span class="value">{{ selectedRequest.sender_phone || 'N/A' }}</span>
                    </div>
                    <div class="info-row flex-column items-start">
                      <span class="label mb-1">Địa chỉ lấy hàng:</span>
                      <span class="value text-left text-xs" style="max-width: 100%; text-align: left;">{{ selectedRequest.pickup_address }}</span>
                    </div>
                  </div>
                </el-col>
                
                <el-col :span="12">
                  <h4 class="section-title"><el-icon class="mr-1"><User /></el-icon> Thông tin người nhận</h4>
                  <div class="info-card">
                    <div class="info-row">
                      <span class="label">Họ tên người nhận:</span>
                      <span class="value fw-bold">{{ waybillDetail?.receiver_name || 'Chưa liên kết vận đơn' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Số điện thoại nhận:</span>
                      <span class="value">{{ waybillDetail?.receiver_phone || 'Chưa liên kết' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Tỉnh/Thành:</span>
                      <span class="value">{{ parseAddress(waybillDetail?.receiver_address).province || 'Chưa liên kết' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Quận/Huyện:</span>
                      <span class="value">{{ parseAddress(waybillDetail?.receiver_address).district || 'Chưa liên kết' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Phường/Xã:</span>
                      <span class="value">{{ parseAddress(waybillDetail?.receiver_address).ward || 'Chưa liên kết' }}</span>
                    </div>
                    <div class="info-row flex-column items-start">
                      <span class="label mb-1">Địa chỉ giao hàng chi tiết:</span>
                      <span class="value text-left text-xs" style="max-width: 100%; text-align: left;">{{ parseAddress(waybillDetail?.receiver_address).detail || 'Chưa liên kết' }}</span>
                    </div>
                  </div>
                </el-col>
              </el-row>

              <!-- Row 2: Hàng hóa & Cấu hình vận chuyển -->
              <el-row :gutter="20">
                <el-col :span="12">
                  <h4 class="section-title"><el-icon class="mr-1"><Box /></el-icon> Thông tin hàng hóa</h4>
                  <div class="info-card">
                    <div class="info-row">
                      <span class="label">Tên sản phẩm:</span>
                      <span class="value">{{ waybillDetail?.product_name || selectedRequest.product_type || 'Chưa rõ' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Khối lượng:</span>
                      <span class="value fw-bold">{{ waybillDetail?.actual_weight || selectedRequest.est_weight || 0 }} kg</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Số lượng:</span>
                      <span class="value fw-bold">{{ selectedRequest.est_quantity || 1 }} kiện</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Kích thước (D x R x C):</span>
                      <span class="value">
                        {{ waybillDetail ? `${waybillDetail.length || 0} x ${waybillDetail.width || 0} x ${waybillDetail.height || 0} cm` : '0 x 0 x 0 cm' }}
                      </span>
                    </div>
                    <div class="info-row">
                      <span class="label">Khai giá:</span>
                      <span class="value fw-semibold">{{ formatCurrencyManual(waybillDetail?.declared_value || 0) }}</span>
                    </div>
                  </div>
                </el-col>

                <el-col :span="12">
                  <h4 class="section-title"><el-icon class="mr-1"><OfficeBuilding /></el-icon> Cấu hình Vận chuyển</h4>
                  <div class="info-card">
                    <div class="info-row">
                      <span class="label">Dịch vụ vận chuyển:</span>
                      <span class="value fw-semibold text-primary">{{ waybillDetail?.service_type || 'Chưa liên kết' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Số tiền thu hộ (COD):</span>
                      <span class="value fw-bold text-success">{{ formatCurrencyManual(waybillDetail?.cod_amount || 0) }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">P.T. thanh toán:</span>
                      <span class="value">{{ getPaymentMethodLabel(waybillDetail?.payment_method) }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Ghi chú khi giao:</span>
                      <span class="value text-xs text-muted" style="max-width: 65%;">{{ waybillDetail?.note || 'Không có' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Dịch vụ gia tăng:</span>
                      <span class="value">
                        <el-tag :type="selectedRequest.is_vehicle_required ? 'danger' : 'info'" size="small">
                          {{ selectedRequest.is_vehicle_required ? 'Yêu cầu xe tải' : 'Không có' }}
                        </el-tag>
                      </span>
                    </div>
                  </div>
                </el-col>
              </el-row>

              <!-- Row 3: Điều phối & Biên nhận thực địa -->
              <h4 class="section-title"><el-icon class="mr-1"><OfficeBuilding /></el-icon> Thông tin điều phối & Vận chuyển</h4>
              <el-row :gutter="20">
                <el-col :span="12">
                  <div class="info-card">
                    <div class="info-row">
                      <span class="label">Nguồn đơn:</span>
                      <span class="value">
                        <el-tag :type="getSourceTagType(selectedRequest.source)" size="small" effect="dark">
                          {{ selectedRequest.source || 'PORTAL' }}
                        </el-tag>
                      </span>
                    </div>
                    <div class="info-row">
                      <span class="label">Mã đơn của shop:</span>
                      <span class="value">{{ selectedRequest.shop_order_code || 'Không có' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Mã vận đơn liên kết:</span>
                      <span class="value text-primary fw-bold">{{ getWaybillCode(selectedRequest) || 'Chưa liên kết' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Người tạo đơn:</span>
                      <span class="value fw-semibold text-dark">{{ getCreatorName(selectedRequest) }}</span>
                    </div>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="info-card">
                    <div class="info-row">
                      <span class="label">Bưu cục xử lý:</span>
                      <span class="value fw-semibold text-primary">{{ selectedRequest.target_hub_name || getHubName(selectedRequest.target_hub_id) || 'Chưa tiếp nhận' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Bưu tá phụ trách:</span>
                      <span class="value fw-semibold text-success">{{ selectedRequest.assigned_shipper_name || 'Chưa gán bưu tá' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Ghi chú yêu cầu:</span>
                      <span class="value text-xs text-muted" style="max-width: 65%;">{{ selectedRequest.notes || 'Không có ghi chú' }}</span>
                    </div>
                  </div>
                </el-col>
              </el-row>

              <!-- Nếu đơn đã lấy thành công và có ảnh biên nhận -->
              <div v-if="selectedRequest.status === 'PICKED' || selectedRequest.pickup_image_url || selectedRequest.pickup_image_urls?.length" class="mt-2">
                <h4 class="section-title"><el-icon class="mr-1"><Check /></el-icon> Biên nhận thực địa</h4>
                <div class="info-card flex gap-4 items-start">
                  <!-- Gallery ảnh pickup - tối đa 5 ảnh -->
                  <div v-if="getPickupImages(selectedRequest).length > 0" class="pickup-proof-gallery flex gap-2 flex-wrap">
                    <el-image
                      v-for="(imgUrl, imgIdx) in getPickupImages(selectedRequest)"
                      :key="'picked-' + imgIdx"
                      style="width: 100px; height: 100px; border-radius: 4px; border: 1px solid var(--border-color, #e2e8f0);"
                      :src="getFullImageUrl(imgUrl)"
                      :preview-src-list="getPickupImages(selectedRequest).map(u => getFullImageUrl(u))"
                      :initial-index="imgIdx"
                      fit="cover"
                    />
                  </div>
                  <div>
                    <div class="info-row mb-1">
                      <span class="label mr-2">Thời gian lấy hàng:</span>
                      <span class="value">
                        {{ 
                          selectedRequest.pickup_assigned_at 
                            ? formatDate(selectedRequest.pickup_assigned_at) 
                            : (selectedRequest.logs?.find(l => l.action?.includes('Gán bưu tá') || l.action?.includes('Gan buu ta'))?.created_at 
                                ? formatDate(selectedRequest.logs.find(l => l.action?.includes('Gán bưu tá') || l.action?.includes('Gan buu ta')).created_at) 
                                : 'Chưa xác định') 
                        }}
                      </span>
                    </div>
                    <div class="info-row mb-0">
                      <span class="label mr-2">Ghi chú lấy hàng:</span>
                      <span class="value text-xs">{{ selectedRequest.logs?.find(l => l.action && l.action.includes('lấy'))?.note || 'Đã lấy hàng thành công' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="Lịch sử hoạt động" name="logs">
              <div class="mt-2 p-2" style="max-height: 350px; overflow-y: auto;">
                <el-timeline v-if="selectedRequest.logs && selectedRequest.logs.length > 0">
                  <el-timeline-item
                    v-for="(log, index) in selectedRequest.logs"
                    :key="index"
                    :timestamp="formatDate(log.created_at)"
                    type="primary"
                  >
                    <div class="flex flex-col gap-1">
                      <strong class="text-dark">{{ log.action }}</strong>
                      <span class="text-xs text-muted" v-if="log.user_name || log.user_id">
                        Thực hiện bởi: {{ log.user_name || userMap[log.user_id] || `ID: ${log.user_id}` }}
                      </span>
                      <span class="text-xs text-muted" v-if="log.note">Chi tiết: {{ log.note }}</span>
                    </div>
                  </el-timeline-item>
                </el-timeline>
                <el-empty v-else description="Chưa có lịch sử hoạt động" :image-size="80" />
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
        <template #footer>
          <div class="flex justify-end">
            <el-button type="primary" @click="detailDialogVisible = false">Đóng</el-button>
          </div>
        </template>
      </el-dialog>

      <input type="file" ref="excelInput" style="display: none;" accept=".xlsx, .xls" @change="handleExcelUpload" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, reactive, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Location, Refresh, Search, Bicycle, OfficeBuilding, Phone, Plus, Check, Close, User, Box, DocumentAdd, List } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/api/axios';
import { getMediaUrl as resolveMediaUrl } from '@/utils/mediaUrl';
import { getPickupImages } from '@/utils/imageHelpers';
import { formatVietnamDateTime } from '@/utils/dateTime';
import * as XLSX from 'xlsx';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const authStore = useAuthStore();

const activeTab = ref('pending');
const excelInput = ref(null);
const loading = ref(false);
const dialogLoading = ref(false);
const uploadLoading = ref(false);

const pendingRequests = ref([]);
const receivedRequests = ref([]);
const assignedRequests = ref([]);
const dispatchRequests = ref([]);
const hubs = ref([]);
const shippers = ref([]);
const customers = ref([]);

const searchPending = ref('');
const searchReceived = ref('');
const searchAssigned = ref('');
const searchDispatch = ref('');

const rejectDialogVisible = ref(false);
const rejectForm = reactive({
  request_codes: [],
  note: ''
});
const dispatchSelection = ref([]);
const receivedSelection = ref([]);

// Selection states
const multipleSelection = ref([]);

// Dialog States
const confirmHubVisible = ref(false);
const selectedHubId = ref(null);
const hubConfirmNote = ref('');

const assignShipperVisible = ref(false);
const selectedRequest = ref(null);
const selectedShipperId = ref(null);
const shipperAssignNote = ref('');

const detailDialogVisible = ref(false);
const detailActiveTab = ref('info');
const waybillDetail = ref(null);
const detailLoading = ref(false);

const viewRequestDetails = async (row) => {
  selectedRequest.value = row;
  detailActiveTab.value = 'info';
  detailDialogVisible.value = true;
  waybillDetail.value = null;

  const waybillCode = getWaybillCode(row);
  if (waybillCode) {
    detailLoading.value = true;
    try {
      const response = await api.post('/api/waybills/search', {
        search_term: waybillCode,
        page: 1,
        size: 1
      });
      if (response.data && response.data.items && response.data.items.length > 0) {
        waybillDetail.value = response.data.items[0];
      }
    } catch (error) {
      console.error('Lỗi khi tải chi tiết vận đơn:', error);
    } finally {
      detailLoading.value = false;
    }
  }
};

const parseAddress = (addrStr) => {
  if (!addrStr) return { province: 'Chưa rõ', district: 'Chưa rõ', ward: 'Chưa rõ', detail: 'Chưa rõ' };
  const parts = addrStr.split(',').map(p => p.trim());
  const len = parts.length;
  const province = len >= 1 ? parts[len - 1] : 'Chưa rõ';
  const district = len >= 2 ? parts[len - 2] : 'Chưa rõ';
  const ward = len >= 3 ? parts[len - 3] : 'Chưa rõ';
  const detail = parts.slice(0, Math.max(1, len - 3)).join(', ');
  return { province, district, ward, detail };
};

const getPaymentMethodLabel = (method) => {
  switch (method) {
    case 'SENDER_PP': return 'Người gửi thanh toán';
    case 'RECEIVER_PP': return 'Người nhận thanh toán';
    case 'SENDER_DEBT': return 'Công nợ người gửi';
    default: return method || 'Chưa rõ';
  }
};

const formatCurrencyManual = (amount) => {
  if (amount === null || amount === undefined) return '0 đ';
  return Number(amount).toLocaleString('vi-VN') + ' đ';
};
const formatDate = (val) => {
  return formatVietnamDateTime(val);
};

const getSourceTagType = (source) => {
  switch (source) {
    case 'PORTAL': return 'success';
    case 'HOTLINE': return 'warning';
    case 'CSKH': return 'primary';
    case 'ADMIN': return 'info';
    default: return 'info';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'PENDING_CONFIRMATION': return 'Chờ xác nhận văn phòng';
    case 'DISPATCHED_TO_HUB': return 'Đã điều phối sang văn phòng';
    case 'RECEIVED': return 'Chờ gán bưu tá';
    case 'ASSIGNED_PICKUP': return 'Đang đi lấy';
    case 'PICKED': return 'Đã lấy hàng thành công';
    case 'HUB_REJECTED': return 'Văn phòng từ chối';
    case 'CANCELLED': return 'Đã hủy';
    default: return status || 'Chưa rõ';
  }
};
const getStatusTagType = (status) => {
  switch (status) {
    case 'PENDING_CONFIRMATION': return 'warning';
    case 'DISPATCHED_TO_HUB': return 'info';
    case 'RECEIVED': return 'primary';
    case 'ASSIGNED_PICKUP': return 'info';
    case 'PICKED': return 'success';
    case 'HUB_REJECTED': return 'danger';
    case 'CANCELLED': return 'danger';
    default: return 'info';
  }
};

// --- Geographic data loaders ---
const ADDR_API = '/vietnam-address.json';
const provinces = ref([]);
const senderDistricts = ref([]);
const senderWards = ref([]);
const receiverDistricts = ref([]);
const receiverWards = ref([]);
let allAddressData = [];

const createDialogVisible = ref(false);
const createFormRef = ref(null);
const createForm = reactive({
  customer_id: null,
  target_hub_id: null,
  source: 'HOTLINE',
  sender_name: '',
  sender_phone: '',
  sender_address_detail: '',
  sender_province_id: null,
  sender_district_id: null,
  sender_ward_id: null,
  sender_province_name: '',
  sender_district_name: '',
  sender_ward_name: '',

  receiver_name: '',
  receiver_phone: '',
  receiver_address_detail: '',
  receiver_province_id: null,
  receiver_district_id: null,
  receiver_ward_id: null,
  receiver_province_name: '',
  receiver_district_name: '',
  receiver_ward_name: '',

  product_name: 'Bưu phẩm bưu kiện',
  weight: 0.5,
  length: 0,
  width: 0,
  height: 0,
  quantity: 1,
  declared_value: 0,
  cod_amount: 0,
  service_type: 'STANDARD',
  payment_method: 'SENDER_DEBT',
  note: ''
});

const createRules = {
  customer_id: [{ required: true, message: 'Vui lòng chọn khách hàng', trigger: 'change' }],
  source: [{ required: true, message: 'Vui lòng chọn nguồn đơn', trigger: 'change' }],
  sender_name: [{ required: true, message: 'Nhập tên người gửi', trigger: 'blur' }],
  sender_phone: [{ required: true, message: 'Nhập SĐT người gửi', trigger: 'blur' }],
  sender_province_id: [{ required: true, message: 'Chọn tỉnh gửi', trigger: 'change' }],
  sender_district_id: [{ required: true, message: 'Chọn huyện gửi', trigger: 'change' }],
  sender_ward_id: [{ required: true, message: 'Chọn xã gửi', trigger: 'change' }],
  sender_address_detail: [{ required: true, message: 'Nhập địa chỉ chi tiết gửi', trigger: 'blur' }],
  receiver_name: [{ required: true, message: 'Nhập tên người nhận', trigger: 'blur' }],
  receiver_phone: [{ required: true, message: 'Nhập SĐT người nhận', trigger: 'blur' }],
  receiver_province_id: [{ required: true, message: 'Chọn tỉnh nhận', trigger: 'change' }],
  receiver_district_id: [{ required: true, message: 'Chọn huyện nhận', trigger: 'change' }],
  receiver_ward_id: [{ required: true, message: 'Chọn xã nhận', trigger: 'change' }],
  receiver_address_detail: [{ required: true, message: 'Nhập địa chỉ chi tiết nhận', trigger: 'blur' }],
  product_name: [{ required: true, message: 'Nhập tên hàng hóa', trigger: 'blur' }],
  weight: [{ required: true, message: 'Nhập khối lượng', trigger: 'change' }]
};

// "Xác nhận đã lấy" States
const pickedDialogVisible = ref(false);
const pickedForm = reactive({
  request_code: '',
  pickup_image_url: '',
  pickup_image_urls: [],
  note: ''
});

// Image Upload Configuration (batch)
const batchPickupUploadUrl = computed(() => {
  const base = import.meta.env.VITE_API_URL || '';
  return `${base}/api/upload/bill/batch?is_pickup=true`;
});

const uploadHeaders = computed(() => {
  return authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {};
});

const getFullImageUrl = resolveMediaUrl;

// Batch upload: tối đa 5 ảnh
const beforeUploadBatch = (file) => {
  const isImage = file.type.startsWith('image/');
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isImage) {
    ElMessage.error('Chỉ chấp nhận file ảnh (JPG/PNG/WEBP)!');
    return false;
  }
  if (!isLt5M) {
    ElMessage.error('Ảnh phải nhỏ hơn 5MB!');
    return false;
  }
  if (pickedForm.pickup_image_urls.length >= 5) {
    ElMessage.warning('Chỉ được tải tối đa 5 ảnh!');
    return false;
  }
  return true;
};

const handleBatchUploadSuccess = (response) => {
  const urls = response?.image_urls || [];
  urls.forEach(url => {
    if (pickedForm.pickup_image_urls.length < 5) {
      pickedForm.pickup_image_urls.push(url);
    }
  });
  if (response?.image_url && !pickedForm.pickup_image_url) {
    pickedForm.pickup_image_url = response.image_url;
  }
  // Đảm bảo pickup_image_url luôn = ảnh đầu tiên trong mảng
  if (pickedForm.pickup_image_urls.length > 0) {
    pickedForm.pickup_image_url = pickedForm.pickup_image_urls[0];
  }
};

const handleSingleUploadSuccess = (response) => {
  const url = response?.image_url || response?.url || '';
  if (url && pickedForm.pickup_image_urls.length < 5) {
    pickedForm.pickup_image_urls.push(url);
    pickedForm.pickup_image_url = pickedForm.pickup_image_urls[0];
  }
};

const removePickupImage = (idx) => {
  pickedForm.pickup_image_urls.splice(idx, 1);
  pickedForm.pickup_image_url = pickedForm.pickup_image_urls[0] || '';
};

const openPickedDialog = (row) => {
  pickedForm.request_code = row.request_code;
  pickedForm.pickup_image_url = '';
  pickedForm.pickup_image_urls = [];
  pickedForm.note = '';
  pickedDialogVisible.value = true;
};

const handleUploadSuccess = (response) => {
  handleSingleUploadSuccess(response);
};

const beforeUpload = (file) => {
  return beforeUploadBatch(file);
};

const submitPicked = async () => {
  if (!pickedForm.pickup_image_urls.length) {
    ElMessage.warning('Vui lòng tải lên ít nhất 1 ảnh biên nhận!');
    return;
  }
  dialogLoading.value = true;
  try {
    await api.post(
      `/api/delivery/pickup-requests/${pickedForm.request_code}/picked`,
      {
        pickup_image_url: pickedForm.pickup_image_urls[0],
        pickup_image_urls: pickedForm.pickup_image_urls,
        note: pickedForm.note || 'Đã lấy hàng thành công'
      }
    );
    ElMessage.success('Xác nhận lấy hàng thành công!');
    pickedDialogVisible.value = false;
    fetchTabRequests('assigned');
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Có lỗi xảy ra khi xác nhận lấy hàng');
  } finally {
    dialogLoading.value = false;
  }
};

// Lấy tên bưu cục từ hub_id (vì BookingRequestResponse không có target_hub_name)
const getHubName = (hubId) => {
  if (!hubId) return null;
  const hub = hubs.value.find(h => h.hub_id === hubId);
  return hub ? hub.hub_name : null;
};

const normalizeProvinceName = (name) => {
  if (!name) return '';
  return name.normalize('NFC').trim().toLowerCase()
    .replace(/^thành phố\s+/i, '')
    .replace(/^tỉnh\s+/i, '')
    .replace(/^tp\.\s*/i, '')
    .replace(/^tp\s+/i, '');
};

// Kiểm tra tỉnh người nhận có bưu cục phát hàng không
// So sánh cả province_id lẫn tên tỉnh (normalized) — giống logic backend _find_hub_for_province
const receiverProvinceNoHub = computed(() => {
  if (!createForm.receiver_province_id) return false;

  const pid = Number(createForm.receiver_province_id);
  const receiverName = normalizeProvinceName(createForm.receiver_province_name);

  const found = hubs.value.some(h => {
    if (h.status === false) return false;
    // 1. So sánh province_id trực tiếp
    if (h.province_id && Number(h.province_id) === pid) return true;
    // 2. Fallback: so sánh tên tỉnh trong hub_name / address_detail
    const hubText = normalizeProvinceName(`${h.hub_name || ''} ${h.address_detail || ''}`);
    return receiverName && (hubText.includes(receiverName) || receiverName.includes(hubText.split(' ')[0]));
  });

  return !found;
});


const getWaybillCode = (row) => {
  if (!row) return '';
  if (row.waybill_code) return row.waybill_code;
  if (row.logs && Array.isArray(row.logs)) {
    for (const log of row.logs) {
      if (log.note && log.note.includes('Van don')) {
        const match = log.note.match(/SP[A-Z0-9]+/i);
        if (match) {
          return match[0];
        }
      }
    }
  }
  return '';
};

const getWaybillCodes = (row) => {
  if (!row) return [];
  const items = Array.isArray(row.waybill_items)
    ? row.waybill_items
    : (Array.isArray(row.waybills) ? row.waybills : []);
  const codes = items
    .map(item => item?.waybill_code || item?.bill_code || item?.code)
    .filter(Boolean);
  const primaryCode = getWaybillCode(row);
  if (primaryCode) codes.unshift(primaryCode);
  return [...new Set(codes)];
};

const getBagItemCount = (row) => {
  const codes = getWaybillCodes(row);
  return row?.bag_item_count || row?.waybill_count || codes.length || row?.est_quantity || row?.expected_quantity || 0;
};

const getCreatorName = (row) => {
  if (!row) return 'Khách hàng thao tác';
  if (row.logs && row.logs.length > 0) {
    const sorted = [...row.logs].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const firstLog = sorted[0];
    if (firstLog && firstLog.user_id) {
      const name = firstLog.user_name || userMap.value[firstLog.user_id];
      if (name) return name;
    }
  }
  return 'Khách hàng thao tác';
};

const getCustomerName = (row) => {
  if (!row) return 'Khách vãng lai';
  if (row.customer_name) return row.customer_name;
  if (row.customer_id) {
    const cust = customers.value.find(c => c.customer_id === row.customer_id);
    if (cust) {
      return cust.company_name || cust.transaction_name || cust.name || 'Khách vãng lai';
    }
  }
  return 'Khách vãng lai';
};

// Filtered data computed properties
const filteredPending = computed(() => {
  if (!searchPending.value) return pendingRequests.value;
  const q = searchPending.value.toLowerCase().trim();
  return pendingRequests.value.filter(r => {
    const wb = getWaybillCode(r).toLowerCase();
    const custName = getCustomerName(r).toLowerCase();
    return r.request_code.toLowerCase().includes(q) ||
      wb.includes(q) ||
      custName.includes(q) ||
      (r.sender_phone && r.sender_phone.includes(q)) ||
      r.pickup_address.toLowerCase().includes(q);
  });
});

const filteredDispatch = computed(() => {
  if (!searchDispatch.value) return dispatchRequests.value;
  const q = searchDispatch.value.toLowerCase().trim();
  return dispatchRequests.value.filter(r => {
    const wb = getWaybillCode(r).toLowerCase();
    const custName = getCustomerName(r).toLowerCase();
    return r.request_code.toLowerCase().includes(q) ||
      wb.includes(q) ||
      custName.includes(q) ||
      (r.sender_phone && r.sender_phone.includes(q)) ||
      r.pickup_address.toLowerCase().includes(q);
  });
});

const filteredReceived = computed(() => {
  if (!searchReceived.value) return receivedRequests.value;
  const q = searchReceived.value.toLowerCase().trim();
  return receivedRequests.value.filter(r => {
    const wb = getWaybillCode(r).toLowerCase();
    const custName = getCustomerName(r).toLowerCase();
    return r.request_code.toLowerCase().includes(q) ||
      wb.includes(q) ||
      custName.includes(q) ||
      (r.sender_phone && r.sender_phone.includes(q)) ||
      r.pickup_address.toLowerCase().includes(q);
  });
});

const filteredAssigned = computed(() => {
  if (!searchAssigned.value) return assignedRequests.value;
  const q = searchAssigned.value.toLowerCase().trim();
  return assignedRequests.value.filter(r => {
    const wb = getWaybillCode(r).toLowerCase();
    const custName = getCustomerName(r).toLowerCase();
    return r.request_code.toLowerCase().includes(q) ||
      wb.includes(q) ||
      custName.includes(q) ||
      (r.sender_phone && r.sender_phone.includes(q)) ||
      (r.assigned_shipper_name && r.assigned_shipper_name.toLowerCase().includes(q)) ||
      r.pickup_address.toLowerCase().includes(q);
  });
});

const handlePendingRequestSelectionChange = (group, selection) => {
  const groupRequestIds = new Set((group.requests || []).map(req => req.request_id));
  const selectedIds = new Set((selection || []).map(req => req.request_id));
  const selectionsFromOtherGroups = multipleSelection.value.filter(req => !groupRequestIds.has(req.request_id));
  const selectionsFromThisGroup = (group.requests || []).filter(req => selectedIds.has(req.request_id));
  multipleSelection.value = [...selectionsFromOtherGroups, ...selectionsFromThisGroup];
};

const groupRequestsByCustomer = (requests) => {
  const groups = {};
  requests.forEach(req => {
    const key = `${req.sender_phone}_${getCustomerName(req)}_${req.pickup_address}`;
    if (!groups[key]) {
      groups[key] = {
        group_key: key,
        customer_name: getCustomerName(req),
        customer_phone: req.sender_phone,
        customer_code: req.customer_code || '',
        pickup_address: req.pickup_address,
        source: req.source || 'PORTAL',
        requests: [],
        total_weight: 0,
        total_quantity: 0
      };
    }
    groups[key].requests.push(req);
    groups[key].total_weight += Number(req.est_weight || 0);
    groups[key].total_quantity += Number(req.est_quantity || 0);
  });
  return Object.values(groups);
};

const groupedPending = computed(() => groupRequestsByCustomer(filteredPending.value));
const groupedDispatch = computed(() => groupRequestsByCustomer(filteredDispatch.value));
const groupedReceived = computed(() => groupRequestsByCustomer(filteredReceived.value));

const openGroupAssignShipperDialog = (group) => {
  multipleSelection.value = group.requests;
  openAssignShipperDialog(group.requests[0]);
};

const handleTabChange = (tab) => {
  multipleSelection.value = [];
  dispatchSelection.value = [];
  receivedSelection.value = [];
  fetchTabRequests(tab);
};

const handleRefresh = () => {
  handleTabChange(activeTab.value);
};

const fetchTabRequests = async (tabName) => {
  loading.value = true;
  try {
    const isAdmin = authStore.user?.role_id === 1;
    const hubId = isAdmin ? null : (authStore.user?.primary_hub_id || null);

    if (tabName === 'pending') {
      const [resPending, resRejected] = await Promise.all([
        api.get('/api/delivery/online-pickup-requests', { params: { status: 'PENDING_CONFIRMATION' } }),
        api.get('/api/delivery/online-pickup-requests', { params: { status: 'HUB_REJECTED' } })
      ]);
      pendingRequests.value = [...(resPending.data || []), ...(resRejected.data || [])];
    } else if (tabName === 'dispatch-hub') {
      if (isAdmin) {
        const params = { status: 'DISPATCHED_TO_HUB' };
        if (selectedHubId.value) params.hub_id = selectedHubId.value;
        const res = await api.get('/api/delivery/hub-dispatch-requests', { params });
        dispatchRequests.value = res.data || [];
      } else {
        const res = await api.get('/api/delivery/hub-dispatch-requests', {
          params: { status: 'DISPATCHED_TO_HUB', hub_id: hubId }
        });
        dispatchRequests.value = res.data || [];
      }
    } else if (tabName === 'received') {
      if (isAdmin) {
        const params = { status: 'RECEIVED' };
        if (selectedHubId.value) params.hub_id = selectedHubId.value;
        const res = await api.get('/api/delivery/pickup-requests', { params });
        receivedRequests.value = res.data || [];
      } else {
        const res = await api.get('/api/delivery/hub-pickup-requests', {
          params: { status: 'RECEIVED', hub_id: hubId }
        });
        receivedRequests.value = res.data || [];
      }
    } else if (tabName === 'assigned') {
      if (isAdmin) {
        const params = { status: 'ASSIGNED_PICKUP' };
        if (selectedHubId.value) params.hub_id = selectedHubId.value;
        const res = await api.get('/api/delivery/pickup-requests', { params });
        assignedRequests.value = res.data || [];
      } else {
        const res = await api.get('/api/delivery/hub-pickup-requests', {
          params: { status: 'ASSIGNED_PICKUP', hub_id: hubId }
        });
        assignedRequests.value = res.data || [];
      }
    }
  } catch (err) {
    const detail = err.response?.data?.detail || '';

    if (detail.toLowerCase().includes('van phong')) {
      receivedRequests.value = [];
      assignedRequests.value = [];
      dispatchRequests.value = [];
    } else {
      ElMessage.error(detail || 'Lỗi tải danh sách yêu cầu lấy hàng');
    }
  } finally {
    loading.value = false;
  }
};


const userMap = ref({});
const fetchUsers = async () => {
  try {
    const res = await api.get('/api/users');
    const allUsers = Array.isArray(res.data) ? res.data : [];
    const map = {};
    allUsers.forEach(u => {
      map[u.user_id] = u.full_name ? `${u.full_name} (${u.username})` : u.username;
    });
    userMap.value = map;
  } catch (err) {
    console.error('Không tải được danh sách tài khoản:', err);
  }
};


const fetchHubs = async () => {
  try {
    const res = await api.get('/api/hubs');
    hubs.value = (res.data.items || res.data || []).filter(h => h.status !== false);
  } catch (err) {
    console.error('Không tải được danh sách bưu cục:', err);
  }
};

const fetchShippersForHub = async (hubId) => {
  try {
    const res = await api.get('/api/users/shippers', {
      params: { hub_id: hubId }
    });
    shippers.value = res.data || [];
  } catch (err) {
    console.error('Không tải được danh sách bưu tá:', err);
  }
};

const fetchCustomers = async () => {
  try {
    const res = await api.get('/api/customers');
    customers.value = res.data.items || res.data || [];
  } catch (err) {
    console.error('Không tải được danh sách khách hàng:', err);
  }
};

// --- Geographic data loaders using local JSON ---
const fetchProvinces = async () => {
  try {
    const res = await fetch(ADDR_API);
    allAddressData = await res.json();
    provinces.value = allAddressData.map(p => ({ id: p.Id, name: p.Name }));
  } catch (err) {
    console.error('Không thể tải danh sách tỉnh/thành phố', err);
  }
};

const fetchDistrictsForProvince = async (provinceId) => {
  if (!provinceId || !allAddressData.length) return [];
  const pId = Number(provinceId);
  const prov = allAddressData.find(p => Number(p.Id) === pId);
  if (!prov || !prov.Districts) return [];
  return prov.Districts.map(d => ({ id: d.Id, name: d.Name }));
};

const fetchWardsForDistrict = async (districtId) => {
  if (!districtId || !allAddressData.length) return [];
  const dId = Number(districtId);
  for (const prov of allAddressData) {
    if (prov.Districts) {
      const dist = prov.Districts.find(d => Number(d.Id) === dId);
      if (dist && dist.Wards) {
        return dist.Wards.map(w => ({ id: w.Id, name: w.Name }));
      }
    }
  }
  return [];
};

const handleSenderProvinceChange = async () => {
  createForm.sender_district_id = null;
  createForm.sender_ward_id = null;
  senderWards.value = [];
  if (createForm.sender_province_id) {
    senderDistricts.value = await fetchDistrictsForProvince(createForm.sender_province_id);
    const prov = provinces.value.find(p => Number(p.id) === Number(createForm.sender_province_id));
    createForm.sender_province_name = prov ? prov.name : '';
  } else {
    senderDistricts.value = [];
    createForm.sender_province_name = '';
  }
};

const handleSenderDistrictChange = async () => {
  createForm.sender_ward_id = null;
  if (createForm.sender_district_id) {
    senderWards.value = await fetchWardsForDistrict(createForm.sender_district_id);
    const dist = senderDistricts.value.find(d => Number(d.id) === Number(createForm.sender_district_id));
    createForm.sender_district_name = dist ? dist.name : '';
  } else {
    senderWards.value = [];
    createForm.sender_district_name = '';
  }
};

const handleSenderWardChange = () => {
  if (createForm.sender_ward_id) {
    const ward = senderWards.value.find(w => Number(w.id) === Number(createForm.sender_ward_id));
    createForm.sender_ward_name = ward ? ward.name : '';
  } else {
    createForm.sender_ward_name = '';
  }
};

const handleReceiverProvinceChange = async () => {
  createForm.receiver_district_id = null;
  createForm.receiver_ward_id = null;
  receiverWards.value = [];
  if (createForm.receiver_province_id) {
    receiverDistricts.value = await fetchDistrictsForProvince(createForm.receiver_province_id);
    const prov = provinces.value.find(p => Number(p.id) === Number(createForm.receiver_province_id));
    createForm.receiver_province_name = prov ? prov.name : '';
  } else {
    receiverDistricts.value = [];
    createForm.receiver_province_name = '';
  }
};

const handleReceiverDistrictChange = async () => {
  createForm.receiver_ward_id = null;
  if (createForm.receiver_district_id) {
    receiverWards.value = await fetchWardsForDistrict(createForm.receiver_district_id);
    const dist = receiverDistricts.value.find(d => Number(d.id) === Number(createForm.receiver_district_id));
    createForm.receiver_district_name = dist ? dist.name : '';
  } else {
    receiverWards.value = [];
    createForm.receiver_district_name = '';
  }
};

const handleReceiverWardChange = () => {
  if (createForm.receiver_ward_id) {
    const ward = receiverWards.value.find(w => Number(w.id) === Number(createForm.receiver_ward_id));
    createForm.receiver_ward_name = ward ? ward.name : '';
  } else {
    createForm.receiver_ward_name = '';
  }
};

const handleCustomerChange = async (val) => {
  const c = customers.value.find(item => item.customer_id === val);
  if (!c) return;

  createForm.sender_name = c.transaction_name || c.company_name || c.representative_name || '';
  createForm.sender_phone = c.phone_number || '';
  createForm.sender_province_id = c.province_id || null;
  createForm.sender_district_id = c.district_id || null;
  createForm.sender_ward_id = c.ward_id || null;
  createForm.sender_address_detail = c.address_detail || c.street_address || '';

  // Load cascading dropdowns
  if (c.province_id) {
    senderDistricts.value = await fetchDistrictsForProvince(c.province_id);
    const prov = provinces.value.find(p => Number(p.id) === Number(c.province_id));
    createForm.sender_province_name = prov ? prov.name : c.province_name || '';
  } else {
    senderDistricts.value = [];
    createForm.sender_province_name = '';
  }

  if (c.district_id) {
    senderWards.value = await fetchWardsForDistrict(c.district_id);
    const dist = senderDistricts.value.find(d => Number(d.id) === Number(c.district_id));
    createForm.sender_district_name = dist ? dist.name : '';
  } else {
    senderWards.value = [];
    createForm.sender_district_name = '';
  }

  if (c.ward_id) {
    const ward = senderWards.value.find(w => Number(w.id) === Number(c.ward_id));
    createForm.sender_ward_name = ward ? ward.name : c.ward_name || '';
  } else {
    createForm.sender_ward_name = '';
  }
};

// --- Dialog: Tạo đơn CSKH/Hotline ---
const openCreatePickupDialog = async () => {
  // Reset createForm fields
  Object.assign(createForm, {
    customer_id: null,
    target_hub_id: null,
    source: 'HOTLINE',
    sender_name: '',
    sender_phone: '',
    sender_address_detail: '',
    sender_province_id: null,
    sender_district_id: null,
    sender_ward_id: null,
    sender_province_name: '',
    sender_district_name: '',
    sender_ward_name: '',
    receiver_name: '',
    receiver_phone: '',
    receiver_address_detail: '',
    receiver_province_id: null,
    receiver_district_id: null,
    receiver_ward_id: null,
    receiver_province_name: '',
    receiver_district_name: '',
    receiver_ward_name: '',
    product_name: 'Bưu phẩm bưu kiện',
    weight: 0.5,
    length: 0,
    width: 0,
    height: 0,
    quantity: 1,
    declared_value: 0,
    cod_amount: 0,
    service_type: 'STANDARD',
    payment_method: 'SENDER_DEBT',
    note: ''
  });

  senderDistricts.value = [];
  senderWards.value = [];
  receiverDistricts.value = [];
  receiverWards.value = [];

  createDialogVisible.value = true;
};

const submitCreatePickup = async () => {
  if (!createFormRef.value) return;
  
  await createFormRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning('Vui lòng kiểm tra và hoàn tất đầy đủ thông tin bắt buộc.');
      return;
    }

    dialogLoading.value = true;
    try {
      const payload = {
        customer_id: createForm.customer_id,
        target_hub_id: createForm.target_hub_id || null,
        source: createForm.source,
        order_type: "DOMESTIC",
        shop_order_code: `HL-${Date.now()}`,
        sender: {
          name: createForm.sender_name,
          phone: createForm.sender_phone,
          address: `${createForm.sender_address_detail}, ${createForm.sender_ward_name}, ${createForm.sender_district_name}, ${createForm.sender_province_name}`,
          province_id: Number(createForm.sender_province_id),
          district_id: Number(createForm.sender_district_id),
          ward_id: Number(createForm.sender_ward_id),
          province_name: createForm.sender_province_name,
          district_name: createForm.sender_district_name,
          ward_name: createForm.sender_ward_name
        },
        receiver: {
          name: createForm.receiver_name,
          phone: createForm.receiver_phone,
          address: `${createForm.receiver_address_detail}, ${createForm.receiver_ward_name}, ${createForm.receiver_district_name}, ${createForm.receiver_province_name}`,
          province_id: Number(createForm.receiver_province_id),
          district_id: Number(createForm.receiver_district_id),
          ward_id: Number(createForm.receiver_ward_id),
          province_name: createForm.receiver_province_name,
          district_name: createForm.receiver_district_name,
          ward_name: createForm.receiver_ward_name
        },
        items: [
          {
            product_group: "PARCEL",
            product_name: createForm.product_name || "Bưu phẩm bưu kiện",
            description: createForm.note || "",
            weight: Number(createForm.weight || 0.5),
            length: Number(createForm.length || 0),
            width: Number(createForm.width || 0),
            height: Number(createForm.height || 0),
            quantity: Number(createForm.quantity || 1),
            declared_value: Number(createForm.declared_value || 0),
          }
        ],
        documents: [],
        cod_amount: Number(createForm.cod_amount || 0),
        cod_receiver_pays_fee: false,
        service_type: createForm.service_type || "STANDARD",
        extra_services: [],
        delivery_note_option: "CHO_XEM_HANG",
        note: createForm.note || "",
        payment_method: createForm.payment_method || "SENDER_DEBT",
        save_as_draft: false
      };

      const res = await api.post('/api/waybills/admin/pickups', payload);
      const data = res.data;

      ElMessage.success(`Tạo yêu cầu thành công! Vận đơn: ${data.waybill_code}`);
      createDialogVisible.value = false;

      // Handle redirect / switch tabs depending on target_hub_id selection
      if (data.pickup_status === 'RECEIVED') {
        // Nếu Super Admin, tự đổi selectedHubId sang hub của đơn vừa tạo
        if (authStore.user?.role_id === 1 && createForm.target_hub_id) {
          selectedHubId.value = createForm.target_hub_id;
        }
        activeTab.value = 'received';
        fetchTabRequests('received');
      } else {
        activeTab.value = 'pending';
        fetchTabRequests('pending');
      }
    } catch (err) {
      ElMessage.error(err.response?.data?.detail || 'Có lỗi xảy ra khi tạo yêu cầu lấy hàng.');
    } finally {
      dialogLoading.value = false;
    }
  });
};

const findHubForAddress = (address) => {
  if (!address) return null;
  const parts = address.split(',').map(p => p.trim());
  let provinceName = '';
  if (parts.length >= 2) {
    if (parts[parts.length - 1].toLowerCase().includes('việt nam')) {
      provinceName = parts[parts.length - 2] || '';
    } else {
      provinceName = parts[parts.length - 1] || '';
    }
  } else {
    provinceName = parts[0] || '';
  }
  
  const normProvince = normalizeProvinceName(provinceName);
  if (!normProvince) return null;

  const match = hubs.value.find(h => {
    const hubText = normalizeProvinceName(`${h.hub_name || ''} ${h.address_detail || ''}`);
    return hubText.includes(normProvince) || normProvince.includes(hubText);
  });
  return match ? match.hub_id : null;
};

// --- Dialog: Confirm Hub (Tab 1) ---
const openConfirmHubDialog = () => {
  let defaultHubId = null;
  if (multipleSelection.value && multipleSelection.value.length > 0) {
    const firstWithHub = multipleSelection.value.find(r => r.target_hub_id);
    if (firstWithHub) {
      defaultHubId = firstWithHub.target_hub_id;
    } else {
      const firstReq = multipleSelection.value[0];
      if (firstReq && firstReq.pickup_address) {
        defaultHubId = findHubForAddress(firstReq.pickup_address);
      }
    }
  }
  selectedHubId.value = defaultHubId || authStore.user?.primary_hub_id || null;
  hubConfirmNote.value = '';
  confirmHubVisible.value = true;
};

const submitConfirmHub = async () => {
  if (!selectedHubId.value) return;
  
  dialogLoading.value = true;
  try {
    const requestIds = multipleSelection.value.map(r => r.request_id);
    await api.post('/api/delivery/online-pickup-requests/dispatch-hub', {
      request_ids: requestIds,
      hub_id: selectedHubId.value,
      note: hubConfirmNote.value.trim() || 'Điều phối văn phòng lấy hàng online'
    });
    
    ElMessage.success(`Đã điều phối ${requestIds.length} yêu cầu sang bưu cục thành công!`);
    confirmHubVisible.value = false;
    multipleSelection.value = [];
    activeTab.value = 'dispatch-hub';
    fetchTabRequests('dispatch-hub');
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Có lỗi xảy ra khi điều phối bưu cục');
  } finally {
    dialogLoading.value = false;
  }
};

// --- Dialog: Assign Shipper (Tab 2) ---
const openAssignShipperDialog = async (row) => {
  selectedRequest.value = row;
  selectedShipperId.value = null;
  shipperAssignNote.value = '';
  
  if (!multipleSelection.value.some(r => r.request_code === row.request_code)) {
    multipleSelection.value = [];
  }
  
  dialogLoading.value = true;
  assignShipperVisible.value = true;
  
  // Load shippers based on target hub of request
  await fetchShippersForHub(row.target_hub_id);
  dialogLoading.value = false;
};

const submitAssignShipper = async () => {
  if (!selectedShipperId.value || !selectedRequest.value) return;
  
  dialogLoading.value = true;
  try {
    const requestsToAssign = multipleSelection.value.length > 0 ? multipleSelection.value : [selectedRequest.value];
    let successCount = 0;
    
    for (const r of requestsToAssign) {
      await api.post(`/api/delivery/pickup-requests/${r.request_code}/assign-shipper`, {
        shipper_id: selectedShipperId.value,
        note: shipperAssignNote.value.trim() || 'Phân công bưu tá lấy hàng'
      });
      successCount++;
    }
    
    ElMessage.success(`Đã phân công bưu tá cho ${successCount} yêu cầu thành công!`);
    assignShipperVisible.value = false;
    multipleSelection.value = [];
    receivedSelection.value = [];
    fetchTabRequests('received');
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Có lỗi xảy ra khi phân công bưu tá');
  } finally {
    dialogLoading.value = false;
  }
};

const openBulkAssignShipperDialog = () => {
  if (receivedSelection.value.length === 0) return;
  multipleSelection.value = [...receivedSelection.value];
  openAssignShipperDialog(receivedSelection.value[0]);
};

const handleAcceptDispatch = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn CHẤP NHẬN yêu cầu lấy hàng ${row.request_code} và tạo vận đơn không?`,
      'Xác nhận tiếp nhận',
      {
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy',
        type: 'success',
      }
    );
    
    loading.value = true;
    const res = await api.post(`/api/delivery/hub-dispatch-requests/${row.request_code}/accept`, {
      note: 'Bưu cục đã tiếp nhận yêu cầu điều phối'
    });
    
    ElMessage.success(`Đã tiếp nhận yêu cầu điều phối thành công! Vận đơn: ${res.data.waybill_code || '---'}`);
    fetchTabRequests('dispatch-hub');
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.detail || 'Có lỗi xảy ra khi tiếp nhận yêu cầu');
    }
  } finally {
    loading.value = false;
  }
};

const handleBulkAcceptDispatch = async () => {
  if (dispatchSelection.value.length === 0) return;
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn CHẤP NHẬN ${dispatchSelection.value.length} yêu cầu lấy hàng đã chọn và tạo vận đơn không?`,
      'Xác nhận tiếp nhận hàng loạt',
      {
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy',
        type: 'success',
      }
    );

    loading.value = true;
    let successCount = 0;
    for (const req of dispatchSelection.value) {
      try {
        await api.post(`/api/delivery/hub-dispatch-requests/${req.request_code}/accept`, {
          note: 'Bưu cục đã tiếp nhận yêu cầu điều phối hàng loạt'
        });
        successCount++;
      } catch (err) {
        console.error(`Lỗi khi tiếp nhận đơn ${req.request_code}:`, err);
      }
    }

    ElMessage.success(`Đã tiếp nhận thành công ${successCount}/${dispatchSelection.value.length} yêu cầu lấy hàng!`);
    dispatchSelection.value = [];
    fetchTabRequests('dispatch-hub');
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('Có lỗi xảy ra khi tiếp nhận hàng loạt');
    }
  } finally {
    loading.value = false;
  }
};

const handleGroupAcceptDispatch = (group) => {
  dispatchSelection.value = [...group.requests];
  handleBulkAcceptDispatch();
};

const openRejectDialog = (row) => {
  rejectForm.request_codes = [row.request_code];
  rejectForm.note = '';
  rejectDialogVisible.value = true;
};

const openBulkRejectDialog = () => {
  rejectForm.request_codes = dispatchSelection.value.map(r => r.request_code);
  rejectForm.note = '';
  rejectDialogVisible.value = true;
};

const openGroupRejectDialog = (group) => {
  rejectForm.request_codes = group.requests.map(r => r.request_code);
  rejectForm.note = '';
  rejectDialogVisible.value = true;
};

const submitRejectDispatch = async () => {
  if (!rejectForm.note.trim()) {
    ElMessage.warning('Vui lòng nhập lý do từ chối');
    return;
  }
  
  dialogLoading.value = true;
  try {
    let successCount = 0;
    for (const code of rejectForm.request_codes) {
      try {
        await api.post(`/api/delivery/hub-dispatch-requests/${code}/reject`, {
          note: rejectForm.note.trim()
        });
        successCount++;
      } catch (err) {
        console.error(`Lỗi khi từ chối đơn ${code}:`, err);
      }
    }
    
    ElMessage.success(`Đã từ chối ${successCount}/${rejectForm.request_codes.length} yêu cầu điều phối thành công!`);
    rejectDialogVisible.value = false;
    dispatchSelection.value = [];
    fetchTabRequests('dispatch-hub');
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || 'Có lỗi xảy ra khi từ chối yêu cầu');
  } finally {
    dialogLoading.value = false;
  }
};

const handleDispatchRequestSelectionChange = (group, selection) => {
  const groupRequestIds = new Set((group.requests || []).map(req => req.request_id));
  const selectedIds = new Set((selection || []).map(req => req.request_id));
  const selectionsFromOtherGroups = dispatchSelection.value.filter(req => !groupRequestIds.has(req.request_id));
  const selectionsFromThisGroup = (group.requests || []).filter(req => selectedIds.has(req.request_id));
  dispatchSelection.value = [...selectionsFromOtherGroups, ...selectionsFromThisGroup];
};

const handleReceivedRequestSelectionChange = (group, selection) => {
  const groupRequestIds = new Set((group.requests || []).map(req => req.request_id));
  const selectedIds = new Set((selection || []).map(req => req.request_id));
  const selectionsFromOtherGroups = receivedSelection.value.filter(req => !groupRequestIds.has(req.request_id));
  const selectionsFromThisGroup = (group.requests || []).filter(req => selectedIds.has(req.request_id));
  receivedSelection.value = [...selectionsFromOtherGroups, ...selectionsFromThisGroup];
};

const handleRealtimeEvent = (e) => {
  const { event } = e.detail;
  if (event && event.startsWith('pickup.')) {
    handleRefresh();
  }
};

onBeforeUnmount(() => {
  window.removeEventListener('realtime-pickup-event', handleRealtimeEvent);
});

onMounted(async () => {
  fetchHubs();
  fetchCustomers();
  fetchProvinces();
  fetchUsers();
  window.addEventListener('realtime-pickup-event', handleRealtimeEvent);

  if (route.query.tab) {
    activeTab.value = route.query.tab;
  }

  // Ràng buộc quyền truy cập tab pending: Nếu không phải Admin (role_id !== 1) thì không cho vào tab pending
  if (authStore.user?.role_id !== 1 && activeTab.value === 'pending') {
    activeTab.value = 'dispatch-hub';
  }

  const searchCode = route.query.search;
  if (searchCode) {
    const q = String(searchCode).trim();

    // Tải dữ liệu của các tab để tìm xem đơn nằm ở đâu
    await Promise.all([
      fetchTabRequests('pending'),
      fetchTabRequests('dispatch-hub'),
      fetchTabRequests('received'),
      fetchTabRequests('assigned')
    ]);

    // Tự động chuyển tab tương ứng có chứa mã đơn hàng tìm kiếm (mã yêu cầu hoặc mã vận đơn)
    if (pendingRequests.value.some(r => r.request_code === q || getWaybillCode(r) === q)) {
      if (authStore.user?.role_id === 1) {
        activeTab.value = 'pending';
        searchPending.value = q;
      } else {
        activeTab.value = 'dispatch-hub';
      }
    } else if (dispatchRequests.value.some(r => r.request_code === q || getWaybillCode(r) === q)) {
      activeTab.value = 'dispatch-hub';
      searchDispatch.value = q;
    } else if (receivedRequests.value.some(r => r.request_code === q || getWaybillCode(r) === q)) {
      activeTab.value = 'received';
      searchReceived.value = q;
    } else if (assignedRequests.value.some(r => r.request_code === q || getWaybillCode(r) === q)) {
      activeTab.value = 'assigned';
      searchAssigned.value = q;
    } else {
      // Fallback nếu không khớp tab nào cụ thể, đặt ở pending nếu admin, ngược lại đặt ở dispatch-hub
      if (authStore.user?.role_id === 1) {
        activeTab.value = 'pending';
        searchPending.value = q;
      } else {
        activeTab.value = 'dispatch-hub';
        searchDispatch.value = q;
      }
    }
  } else {
    fetchTabRequests(activeTab.value);
  }
});

watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab) {
      let resolvedTab = newTab;
      if (authStore.user?.role_id !== 1 && resolvedTab === 'pending') {
        resolvedTab = 'dispatch-hub';
      }
      activeTab.value = resolvedTab;
      fetchTabRequests(resolvedTab);
    }
  }
);
</script>

<style scoped>
/* --- Batch Upload Gallery --- */
.pickup-batch-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.pickup-batch-thumb {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid var(--sp-border, #e2e8f0);
  flex-shrink: 0;
}
.receipt-preview-sm {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.remove-thumb-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(239,68,68,0.85);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  padding: 0;
  line-height: 1;
  transition: background 0.2s;
}
.remove-thumb-btn:hover { background: #dc2626; }
.thumb-label-first {
  position: absolute;
  bottom: 2px;
  left: 2px;
  background: rgba(67,24,255,0.8);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
  line-height: 1.4;
}
.modern-pickup-page {
  min-height: calc(100vh - 64px);
  background-color: var(--sp-bg-app, #f8fafc);
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: var(--sp-text-main, #1e293b);
  padding: 24px;
}

.page-container {
  max-width: 1500px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-center { display: flex; align-items: center; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.w-full { width: 100%; }
.mb-4 { margin-bottom: 16px; }
.mb-3 { margin-bottom: 12px; }
.mt-3 { margin-top: 12px; }
.mr-2 { margin-right: 8px; }
.mr-1 { margin-right: 4px; }
.fw-bold { font-weight: 700; }
.fw-semibold { font-weight: 600; }
.text-dark { color: var(--sp-text-main, #1e293b); }
.text-muted { color: var(--sp-text-muted, #64748b); }
.text-danger { color: var(--sp-danger, #ef4444); }
.text-primary { color: var(--sp-primary, #4318ff); }
.text-xs { font-size: 12px; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-content .title-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
.icon-box.primary { background: rgba(67, 24, 255, 0.1); color: var(--sp-primary, #4318ff); }

.page-title { font-size: 28px; font-weight: 800; color: var(--sp-text-main, #1e293b); margin: 0 0 4px 0; letter-spacing: -0.5px; }
.page-subtitle { color: var(--sp-text-muted, #64748b); font-size: 14px; margin: 0; font-weight: 500; }

.content-card {
  background: var(--sp-surface, #ffffff);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.02);
  border: 1px solid var(--sp-bg-app, #f8fafc);
  padding: 24px;
  overflow: hidden;
}

.card-header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

:deep(.modern-table) {
  --el-table-border-color: transparent;
  --el-table-header-bg-color: #F8FAFC;
  --el-table-header-text-color: var(--sp-text-muted, #64748b);
  --el-table-text-color: var(--sp-text-main, #1e293b);
}
:deep(.modern-table th.el-table__cell) { font-weight: 700; font-size: 12px; text-transform: uppercase; padding: 12px 0; border-bottom: 2px solid var(--sp-bg-app, #f8fafc) !important; }
:deep(.modern-table td.el-table__cell) { padding: 12px 0; border-bottom: 1px solid var(--sp-bg-app, #f8fafc) !important; }

.code-badge { font-family: monospace; font-weight: 800; padding: 4px 8px; border-radius: 6px; font-size: 12px; display: inline-block; }
.code-badge.warning { background: rgba(245, 158, 11, 0.1); color: #D97706; }
.code-badge.success { background: rgba(16, 185, 129, 0.1); color: #059669; }
.code-badge.info { background: rgba(59, 130, 246, 0.1); color: #2563eb; }
.waybill-chip-list { display: flex; flex-wrap: wrap; gap: 6px; }

.sender-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.address-text {
  font-size: 12px;
  color: var(--sp-text-muted, #64748b);
  line-height: 1.4;
}

.search-wrapper {
  width: 240px;
}
:deep(.modern-input-small .el-input__wrapper) { background: #F8FAFC; box-shadow: none !important; border: 1px solid var(--sp-border, #cbd5e1); border-radius: 8px; padding: 4px 10px; transition: all 0.3s; }
:deep(.modern-input-small .el-input__wrapper:hover),
:deep(.modern-input-small .el-input__wrapper.is-focus) { border-color: var(--sp-primary, #4318ff); background: var(--sp-surface, #ffffff); }

/* Dialog Form Styling */
.dialog-form {
  padding: 8px 0;
}
.dialog-form-item {
  margin-bottom: 16px;
}
.dialog-form-item label {
  display: block;
  font-weight: 700;
  font-size: 13px;
  color: var(--sp-text-main, #1e293b);
  margin-bottom: 6px;
}
:deep(.dialog-select) {
  width: 100%;
}
:deep(.dialog-select .el-input__wrapper) {
  border-radius: 8px;
  padding: 6px 12px;
}

/* Tabs styles */
:deep(.el-tabs__header) {
  display: none;
}
:deep(.el-tabs__nav-wrap::after) {
  background-color: var(--sp-bg-app, #f8fafc);
}
:deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 700;
  color: var(--sp-text-muted, #64748b);
  padding: 0 20px;
}
:deep(.el-tabs__item.is-active) {
  color: var(--sp-primary, #4318ff);
}
:deep(.el-tabs__active-bar) {
  background-color: var(--sp-primary, #4318ff);
  height: 3px;
  border-radius: 3px;
}

/* Custom CSS for picked photo uploading */
.upload-container {
  border: 2px dashed #cbd5e1;
  background-color: #f8fafc;
  cursor: pointer;
  transition: all 0.3s ease;
}
.upload-container:hover {
  border-color: var(--sp-success, #10b981);
  background-color: #f0fdf4;
}
.receipt-uploader {
  display: inline-block;
  width: 100%;
}
.receipt-preview {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  border-radius: 6px;
}
.upload-placeholder {
  padding: 24px 0;
}
.receipt-uploader-icon {
  font-size: 28px;
  color: #94a3b8;
}
.preview-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 6px;
}
.upload-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 6px;
  font-size: 12px;
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.preview-wrapper:hover .upload-overlay {
  opacity: 1;
}

/* CSKH Form Styles */
.form-section-title {
  font-size: 14px;
  font-weight: 800;
  color: var(--sp-primary, #4318ff);
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 6px;
}
.dialog-cskh-form {
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 8px;
}

.animate-fade-in { animation: fadeIn 0.4s ease-out; }
.animate-fade-in-up { animation: fadeInUp 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

/* Detail Dialog Styles */
.detail-dialog-content {
  padding: 0 10px;
}
.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin-top: 16px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 6px;
}
.info-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.5;
}
.info-row:last-child {
  margin-bottom: 0;
}
.info-row .label {
  color: #64748b;
  font-weight: 500;
}
.info-row .value {
  color: #0f172a;
  text-align: right;
  max-width: 65%;
  word-break: break-word;
}

.pickup-table-scroll {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 8px;
  scrollbar-gutter: stable;
}

.pickup-table-scroll :deep(.modern-table) {
  min-width: 1250px;
  max-width: none !important;
}

.inner-table-scroll {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 8px;
}

.inner-table-scroll :deep(.inner-table) {
  min-width: 1200px;
  max-width: none !important;
}

</style>
