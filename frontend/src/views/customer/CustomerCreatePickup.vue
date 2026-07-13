<template>
  <div class="customer-portal">
    <div class="portal-container">
      <el-row :gutter="24" class="portal-content">
        <el-col :span="24">
          <div class="create-pickup-form-wrapper animate-fade-in-up">
            <div class="form-header mb-4">
              <div class="flex-center gap-3">
                <el-button circle @click="cancelCreate">
                  <el-icon><ArrowLeft /></el-icon>
                </el-button>
                <div>
                  <h2 class="section-title">Tạo yêu cầu gửi hàng mới</h2>
                  <p class="section-subtitle">Nhập thông tin người gửi, người nhận và gói hàng để tạo vận đơn</p>
                </div>
              </div>
              <div class="form-header-actions">
                <el-dropdown trigger="click">
                  <el-button type="success" plain>
                    <el-icon class="mr-1"><DocumentAdd /></el-icon>Excel <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="triggerExcelImport">
                        <el-icon><DocumentAdd /></el-icon>Nhập từ Excel
                      </el-dropdown-item>
                      <el-dropdown-item @click="downloadTemplate">
                        <el-icon><Download /></el-icon>Tải mẫu Excel
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <el-button @click="saveDraft" type="info" plain>
                  <el-icon class="mr-1"><EditPen /></el-icon>Lưu nháp
                </el-button>
              </div>
            </div>

            <el-row :gutter="24">
              <!-- Left side of form: Input fields -->
              <el-col :xs="24" :sm="24" :md="isBulkMail ? 24 : 16">
                <el-form :model="form" label-position="top">
                  <!-- <div class="pickup-mode-bar mb-4">
                    <div>
                      <div class="pickup-mode-title">Hình thức gửi hàng</div>
                      <div class="pickup-mode-hint">Chọn gửi một đơn hàng đầy đủ hoặc tạo một túi gồm nhiều thư/bưu phẩm.</div>
                    </div>
                    <el-radio-group v-model="form.pickup_mode">
                      <el-radio-button v-for="option in pickupModeOptions" :key="option.value" :label="option.value">
                        {{ option.label }}
                      </el-radio-button>
                    </el-radio-group>
                  </div> -->
                  
                  <!-- SENDER & RECEIVER INFO -->
                  <el-row :gutter="20">
                    <!-- SENDER CARD -->
                    <el-col :xs="24" :sm="12">
                      <el-card class="form-section-card sender-card mb-4" shadow="never">
                        <template #header>
                          <div class="form-card-title text-primary">
                            <el-icon><User /></el-icon><span>Thông tin Người gửi</span>
                          </div>
                        </template>
                        <el-form-item label="Họ tên người gửi" required>
                          <el-input v-model="form.sender.name" placeholder="Tên người gửi hoặc Tên shop" />
                        </el-form-item>
                        <el-form-item label="Số điện thoại" required>
                          <el-input v-model="form.sender.phone" placeholder="Số điện thoại liên hệ" />
                        </el-form-item>

                        <el-row :gutter="20">
                          <el-col :xs="24" :sm="12">
                            <el-form-item label="Tỉnh / Thành phố gửi (Mới)" required>
                              <el-select
                                v-model="selectedSenderProvinceCode"
                                filterable
                                clearable
                                class="w-full"
                                placeholder="Chọn tỉnh / thành mới"
                                @change="handleSenderProvinceChange"
                              >
                                <template #prefix><el-icon><Location /></el-icon></template>
                                <el-option
                                  v-for="p in senderProvinces"
                                  :key="p.Code"
                                  :label="p.FullName"
                                  :value="p.Code"
                                />
                              </el-select>
                            </el-form-item>
                          </el-col>
                          <el-col :xs="24" :sm="12">
                            <el-form-item label="Phường / Xã gửi (Mới)" required>
                              <el-select
                                v-model="selectedSenderWardCode"
                                filterable
                                clearable
                                class="w-full"
                                placeholder="Chọn phường / xã mới"
                                :disabled="!selectedSenderProvinceCode"
                                @change="handleSenderWardChange"
                              >
                                <template #prefix><el-icon><Location /></el-icon></template>
                                <el-option
                                  v-for="w in availableSenderWards"
                                  :key="w.Code"
                                  :label="w.FullName"
                                  :value="w.Code"
                                />
                              </el-select>
                            </el-form-item>
                          </el-col>
                        </el-row>

                        <el-form-item label="Số nhà, tên đường gửi" required>
                          <el-input v-model="form.sender.street_address" placeholder="VD: 12 Nguyễn Huệ" @input="debouncedSimulate" />
                        </el-form-item>

                        <!-- Box hiển thị tỉnh cũ gửi tự động đối soát -->
                        <div v-if="form.sender.old_province" class="address-preview-container animate-fade-in" style="border: 2px solid #2ec17e; border-radius: 12px; padding: 12px; background-color: #f4fbf7; margin-bottom: 18px;">
                          <div style="display: flex; align-items: baseline; gap: 8px;">
                            <span style="font-size: 11px; color: #888; white-space: nowrap; min-width: 130px;">Tỉnh cũ gửi trước sáp nhập:</span>
                            <span v-if="senderLegacyLoading" style="font-size: 12px; color: #999; font-style: italic;">Đang tra cứu...</span>
                            <span v-else style="font-size: 13px; font-weight: 600; color: #2b6cb0;">{{ form.sender.old_province }}</span>
                          </div>
                        </div>
                      </el-card>
                    </el-col>

                    <!-- RECEIVER CARD -->
                    <el-col v-if="!isBulkMail" :xs="24" :sm="12">
                      <el-card class="form-section-card receiver-card mb-4" shadow="never">
                        <template #header>
                          <div class="form-card-title text-success">
                            <el-icon><User /></el-icon>
                            <span>Thông tin Người nhận{{ isBulkMail ? ' (Không bắt buộc)' : '' }}</span>
                          </div>
                        </template>
                        <el-form-item label="Họ tên người nhận" :required="!isBulkMail">
                          <el-autocomplete
                            ref="nameAutocomplete"
                            v-model="form.receiver.name"
                            :fetch-suggestions="queryReceiverByName"
                            clearable
                            placeholder="Tên người nhận hàng"
                            @select="handleSelectReceiver"
                            style="width: 100%;"
                            trigger-on-focus
                          >
                            <template #suffix>
                              <el-icon style="cursor: pointer;" @click="handleTriggerName"><ArrowDown /></el-icon>
                            </template>
                            <template #default="{ item }">
                              <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span class="fw-bold">{{ item.name }}</span>
                                <span style="font-size: 12px; color: var(--sp-text-muted);">{{ item.phone }}</span>
                              </div>
                            </template>
                          </el-autocomplete>
                        </el-form-item>
                        <el-form-item label="Số điện thoại" :required="!isBulkMail">
                          <el-autocomplete
                            ref="phoneAutocomplete"
                            v-model="form.receiver.phone"
                            :fetch-suggestions="queryReceiverByPhone"
                            clearable
                            placeholder="Số điện thoại liên hệ"
                            @select="handleSelectReceiver"
                            style="width: 100%;"
                            trigger-on-focus
                          >
                            <template #suffix>
                              <el-icon style="cursor: pointer;" @click="handleTriggerPhone"><ArrowDown /></el-icon>
                            </template>
                            <template #default="{ item }">
                              <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span class="fw-bold text-success">{{ item.phone }}</span>
                                <span style="font-size: 12px; color: var(--sp-text-muted);">{{ item.name }}</span>
                              </div>
                            </template>
                          </el-autocomplete>
                        </el-form-item>
                        <el-form-item label="Tỉnh/Thành" :required="!isBulkMail">
                          <el-select v-model="form.receiver.province_id" placeholder="Chọn tỉnh" @change="handleReceiverProvinceChange" filterable style="width: 100%;">
                            <el-option v-for="p in provinces" :key="p.id" :label="p.name" :value="p.id" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="Quận/Huyện" :required="!isBulkMail">
                          <el-select v-model="form.receiver.district_id" placeholder="Chọn huyện" @change="handleReceiverDistrictChange" :disabled="!form.receiver.province_id" filterable style="width: 100%;">
                            <el-option v-for="d in receiverDistricts" :key="d.id" :label="d.name" :value="d.id" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="Phường/Xã">
                          <el-select v-model="form.receiver.ward_id" placeholder="Chọn xã" :disabled="!form.receiver.district_id" filterable clearable style="width: 100%;" @change="handleReceiverWardChange">
                            <el-option v-for="w in receiverWards" :key="w.id" :label="w.name" :value="w.id" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="Địa chỉ chi tiết (Số nhà, đường...)">
                          <el-input v-model="form.receiver.address_detail" type="textarea" :rows="2" placeholder="Địa chỉ giao hàng chi tiết" />
                        </el-form-item>
                        
                        <!-- Box hiển thị tỉnh cũ nhận -->
                        <div v-if="form.receiver.province_id && receiverOldProvinceName" class="address-preview-container animate-fade-in" style="border: 2px solid #10b981; border-radius: 12px; padding: 12px; background-color: #f0fdf4; margin-top: 12px;">
                          <div style="display: flex; align-items: baseline; gap: 8px;">
                            <span style="font-size: 11px; color: #888; white-space: nowrap; min-width: 130px;">Tỉnh cũ nhận trước sáp nhập:</span>
                            <span v-if="receiverLegacyLoading" style="font-size: 12px; color: #999; font-style: italic;">Đang tra cứu...</span>
                            <span v-else style="font-size: 13px; font-weight: 600; color: #059669;">{{ receiverOldProvinceName }}</span>
                          </div>
                        </div>
                      </el-card>
                    </el-col>

                    <!-- SETTINGS CARD (Side-by-side with Sender Card when BULK mode) -->
                    <el-col v-if="isBulkMail" :xs="24" :sm="12">
                      <el-card class="form-section-card settings-card mb-4" shadow="never">
                        <template #header>
                          <div class="form-card-title text-info">
                            <el-icon><Setting /></el-icon><span>Cấu hình Vận chuyển</span>
                          </div>
                        </template>

                        <el-form-item label="Dịch vụ vận chuyển" required>
                          <el-radio-group v-model="form.service_type" class="shipping-service-group" :class="{ 'is-express': isExpressService }" @change="debouncedSimulate">
                            <el-radio-button label="TK">Tiết kiệm</el-radio-button>
                            <el-radio-button label="CPN">Chuyển phát nhanh</el-radio-button>
                            <el-radio-button label="HT">Hỏa tốc</el-radio-button>
                          </el-radio-group>
                        </el-form-item>
                        <el-form-item label="Đóng kiện">
                          <el-radio-group v-model="form.packing_type" class="packing-type-group" @change="debouncedSimulate">
                            <el-radio-button :label="null">Không đóng kiện</el-radio-button>
                            <el-radio-button label="WOOD">Đóng kiện gỗ</el-radio-button>
                            <el-radio-button label="FOAM">Đóng kiện xốp</el-radio-button>
                          </el-radio-group>
                        </el-form-item>
                        <el-row :gutter="20">
                          <el-col :xs="24" :sm="12">
                            <el-form-item label="Số tiền thu hộ">
                              <el-input-number v-model="form.cod_amount" :min="0" :step="10000" class="w-full" @change="debouncedSimulate" />
                            </el-form-item>
                          </el-col>
                          <el-col :xs="24" :sm="12">
                            <el-form-item label="Phương thức thanh toán">
                              <el-select v-model="form.payment_method" class="w-full">
                                <el-option label="Shop trả cước cuối tháng" value="SENDER_DEBT" />
                                <el-option label="Shop trả cước ngay khi gửi" value="SENDER_PAY" />
                                <el-option label="Người nhận thanh toán cước" value="RECEIVER_PAY" />
                              </el-select>
                            </el-form-item>
                          </el-col>
                        </el-row>
                        <el-row :gutter="20">
                          <el-col :span="24">
                            <el-form-item label="Phòng ban quản lý (Để theo dõi chi phí)">
                              <el-select v-model="form.customer_department_id" placeholder="Chọn phòng ban (nếu có)" class="w-full" clearable filterable>
                                <el-option
                                  v-for="dept in departmentsList"
                                  :key="dept.id"
                                  :label="dept.name"
                                  :value="dept.id"
                                />
                              </el-select>
                            </el-form-item>
                          </el-col>
                        </el-row>
                        <el-row :gutter="20">
                          <el-col :xs="24" :sm="12">
                            <el-form-item label="Ghi chú khi giao">
                              <el-select v-model="form.delivery_note_option" class="w-full">
                                <el-option label="Cho xem hàng, không thử" value="CHO_XEM_HANG" />
                                <el-option label="Cho thử hàng" value="CHO_THU_HANG" />
                                <el-option label="Không cho xem hàng" value="KHONG_CHO_XEM_HANG" />
                              </el-select>
                            </el-form-item>
                          </el-col>
                          <el-col :xs="24" :sm="12">
                            <el-form-item label="Ghi chú thêm">
                              <el-input v-model="form.note" placeholder="Ghi chú thêm cho bưu tá..." />
                            </el-form-item>
                          </el-col>
                        </el-row>
                      </el-card>
                    </el-col>
                  </el-row>

                  <!-- ITEMS DETAILS -->
                  <el-card v-if="!isBulkMail" class="form-section-card items-card mb-4" shadow="never">
                    <template #header>
                      <div class="form-card-title text-warning">
                        <el-icon><Box /></el-icon><span>Thông tin Hàng hóa</span>
                      </div>
                    </template>
                    <div v-for="(item, index) in form.items" :key="index" class="item-input-row">
                      <el-row :gutter="16">
                        <el-col :xs="24" :sm="8">
                          <el-form-item label="Tên sản phẩm" required>
                            <el-input v-model="item.product_name" placeholder="Ví dụ: Quần áo, mỹ phẩm..." @input="debouncedSimulate" />
                          </el-form-item>
                        </el-col>
                        <el-col :xs="24" :sm="6">
                          <el-form-item label="Loại hàng" required>
                            <el-select v-model="item.product_group" placeholder="Chọn loại hàng" class="w-full" @change="debouncedSimulate">
                              <el-option
                                v-for="pt in productTypes"
                                :key="pt.code"
                                :label="pt.label"
                                :value="pt.code"
                              />
                            </el-select>
                          </el-form-item>
                        </el-col>
                        <el-col :xs="12" :sm="5">
                          <el-form-item label="Khối lượng (kg)">
                            <el-input v-model.number="item.weight" type="number" step="0.01" min="0.01" placeholder="0.05" class="w-full" @input="debouncedSimulate">
                              <template #append>kg</template>
                            </el-input>
                          </el-form-item>
                        </el-col>
                        <el-col :xs="12" :sm="5">
                          <el-form-item label="Số lượng">
                            <el-input v-model.number="item.quantity" type="number" min="1" placeholder="1" class="w-full" @input="debouncedSimulate">
                              <template #append>cái</template>
                            </el-input>
                          </el-form-item>
                        </el-col>
                      </el-row>
                      
                      <el-row :gutter="16" style="margin-top: 12px;">
                        <el-col :xs="24" :sm="14">
                          <el-form-item label="Kích thước cm (Dài x Rộng x Cao)">
                            <div class="dimension-inputs">
                              <el-input v-model.number="item.length" type="number" min="0" placeholder="Dài" @input="debouncedSimulate">
                                <template #append>cm</template>
                              </el-input>
                              <span class="dimension-sep">×</span>
                              <el-input v-model.number="item.width" type="number" min="0" placeholder="Rộng" @input="debouncedSimulate">
                                <template #append>cm</template>
                              </el-input>
                              <span class="dimension-sep">×</span>
                              <el-input v-model.number="item.height" type="number" min="0" placeholder="Cao" @input="debouncedSimulate">
                                <template #append>cm</template>
                              </el-input>
                            </div>
                          </el-form-item>
                        </el-col>
                        <el-col :xs="24" :sm="10">
                          <el-form-item :label="item.product_group === 'HIGH_VALUE' ? 'Khai giá (đ) *' : 'Khai giá (đ)'" :required="item.product_group === 'HIGH_VALUE'">
                            <el-input v-model.number="item.declared_value" type="number" min="0" placeholder="0" class="w-full" @input="debouncedSimulate">
                              <template #append>đ</template>
                            </el-input>
                          </el-form-item>
                        </el-col>
                      </el-row>

                      <!-- Warning & Special handling info -->
                      <div v-if="getProductTypeInfo(item.product_group)?.special_handling" class="special-handling-note mt-2 text-warning" style="font-size: 13px; display: flex; align-items: center; gap: 6px; padding: 8px 12px; background-color: #fdf6ec; border-radius: 6px; border-left: 4px solid #e6a23c; margin-bottom: 12px; line-height: 1.4;">
                        <el-icon><Warning /></el-icon>
                        <div>
                          <strong>{{ getProductTypeInfo(item.product_group)?.label }}:</strong> {{ getProductTypeInfo(item.product_group)?.handling_note }}
                          <span v-if="getProductTypeInfo(item.product_group)?.packing_recommended" style="color: #409eff; font-weight: bold; margin-left: 8px;">
                            (Khuyến nghị: Quý khách nên chọn dịch vụ Đóng kiện để đảm bảo an toàn.)
                          </span>
                        </div>
                      </div>
                    </div>
                  </el-card>

                  <el-card v-else class="form-section-card items-card bulk-mail-card mb-4" shadow="never">
                    <template #header>
                      <div class="form-card-title text-warning">
                        <el-icon><DocumentAdd /></el-icon><span>Thông tin túi thư/bưu phẩm</span>
                      </div>
                    </template>
                    <el-alert
                      :title="bulkMailInstruction"
                      type="info"
                      show-icon
                      :closable="false"
                      class="mb-4"
                    />
                    <el-row :gutter="16">
                      <el-col :xs="24" :sm="12">
                        <el-form-item label="Loại bưu gửi" required>
                          <el-select v-model="form.bulk_product_type" class="w-full" filterable>
                            <el-option v-for="type in bulkProductTypes" :key="type.code" :label="type.label" :value="type.code" />
                          </el-select>
                        </el-form-item>
                      </el-col>
                      <el-col :xs="24" :sm="12">
                        <el-form-item label="Số lượng dự kiến" required>
                          <el-input-number v-model="form.bulk_estimated_quantity" :min="1" :max="10000" controls-position="right" class="w-full" />
                        </el-form-item>
                      </el-col>
                    </el-row>
                    <div class="bulk-recipient-list">
                      <div v-if="form.bulk_estimated_quantity > 1" class="bulk-info-msg mb-3" style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 12px; border-radius: 8px; font-size: 13px; color: #15803d; display: flex; align-items: center; gap: 8px;">
                        <el-icon style="font-size: 16px;"><InfoFilled /></el-icon>
                        <span>Số lượng yêu cầu dự kiến là <strong>{{ form.bulk_estimated_quantity }}</strong>. Khi bạn muốn nhập thông tin chi tiết hãy nhấn thêm thư bên dưới.</span>
                      </div>
                      <div v-for="(mail, index) in form.bulk_draft_items" :key="mail.local_id" class="bulk-recipient-row">
                        <div class="bulk-recipient-header">
                          <strong>{{ form.bulk_product_type === 'DOCUMENT' ? 'Thư' : 'Bưu phẩm' }} {{ index + 1 }}</strong>
                          <el-button v-if="form.bulk_draft_items.length > 1" text type="danger" @click="removeBulkDraftItem(index)">Xóa</el-button>
                        </div>
                        <el-row :gutter="12">
                          <el-col :xs="24" :sm="8">
                            <el-input v-model="mail.receiver_name" placeholder="Tên người nhận (nếu biết)" />
                          </el-col>
                          <el-col :xs="24" :sm="8">
                            <el-input v-model="mail.receiver_phone" placeholder="Số điện thoại (nếu biết)" />
                          </el-col>
                          <el-col :xs="24" :sm="8">
                            <el-input v-model="mail.customer_reference_code" placeholder="Mã riêng của khách (không bắt buộc)" />
                          </el-col>
                          <el-col :span="24" class="mt-2">
                            <el-input v-model="mail.receiver_address" placeholder="Địa chỉ người nhận chưa đầy đủ cũng được" />
                          </el-col>
                        </el-row>
                      </div>
                      <el-button plain type="primary" class="mt-3" @click="addBulkDraftItem">+ Thêm {{ form.bulk_product_type === 'DOCUMENT' ? 'thư' : 'bưu phẩm' }}</el-button>
                    </div>
                  </el-card>

                  <!-- SETTINGS & EXTRA SERVICES -->
                  <el-card v-if="!isBulkMail" class="form-section-card settings-card mb-4" shadow="never">
                    <template #header>
                      <div class="form-card-title text-info">
                        <el-icon><Setting /></el-icon><span>Cấu hình Vận chuyển</span>
                      </div>
                    </template>

                    <el-form-item label="Dịch vụ vận chuyển" required>
                      <el-radio-group v-model="form.service_type" class="shipping-service-group" :class="{ 'is-express': isExpressService }" @change="debouncedSimulate">
                        <el-radio-button label="TK">Tiết kiệm</el-radio-button>
                        <el-radio-button label="CPN">Chuyển phát nhanh</el-radio-button>
                        <el-radio-button label="HT">Hỏa tốc</el-radio-button>
                      </el-radio-group>
                    </el-form-item>
                    <el-form-item label="Đóng kiện">
                      <el-radio-group v-model="form.packing_type" class="packing-type-group" @change="debouncedSimulate">
                        <el-radio-button :label="null">Không đóng kiện</el-radio-button>
                        <el-radio-button label="WOOD">Đóng kiện gỗ</el-radio-button>
                        <el-radio-button label="FOAM">Đóng kiện xốp</el-radio-button>
                      </el-radio-group>
                    </el-form-item>
                    <el-row :gutter="20">
                      <el-col :xs="24" :sm="12">
                        <el-form-item label="Số tiền thu hộ">
                          <el-input-number v-model="form.cod_amount" :min="0" :step="10000" class="w-full" @change="debouncedSimulate" />
                        </el-form-item>
                      </el-col>
                      <el-col :xs="24" :sm="12">
                        <el-form-item label="Phương thức thanh toán">
                          <el-select v-model="form.payment_method" class="w-full">
                            <el-option label="Shop trả cước cuối tháng" value="SENDER_DEBT" />
                            <el-option label="Shop trả cước ngay khi gửi" value="SENDER_PAY" />
                            <el-option label="Người nhận thanh toán cước" value="RECEIVER_PAY" />
                          </el-select>
                        </el-form-item>
                      </el-col>
                    </el-row>
                    <el-row :gutter="20">
                      <el-col :span="24">
                        <el-form-item label="Phòng ban quản lý (Để theo dõi chi phí)">
                          <el-select v-model="form.customer_department_id" placeholder="Chọn phòng ban (nếu có)" class="w-full" clearable filterable>
                            <el-option
                              v-for="dept in departmentsList"
                              :key="dept.id"
                              :label="dept.name"
                              :value="dept.id"
                            />
                          </el-select>
                        </el-form-item>
                      </el-col>
                    </el-row>
                    <el-row :gutter="20">
                      <el-col :xs="24" :sm="12">
                        <el-form-item label="Ghi chú khi giao">
                          <el-select v-model="form.delivery_note_option" class="w-full">
                            <el-option label="Cho xem hàng, không thử" value="CHO_XEM_HANG" />
                            <el-option label="Cho thử hàng" value="CHO_THU_HANG" />
                            <el-option label="Không cho xem hàng" value="KHONG_CHO_XEM_HANG" />
                          </el-select>
                        </el-form-item>
                      </el-col>
                      <el-col :xs="24" :sm="12">
                        <el-form-item label="Ghi chú thêm">
                          <el-input v-model="form.note" placeholder="Ghi chú thêm cho bưu tá..." />
                        </el-form-item>
                      </el-col>
                    </el-row>
                  </el-card>

                  <el-card v-if="!isBulkMail" class="form-section-card extra-services-card mb-4" shadow="never">
                    <template #header>
                      <div class="form-card-title text-primary">
                        <el-icon><CircleCheck /></el-icon><span>Dịch vụ gia tăng</span>
                      </div>
                    </template>
                    <el-checkbox-group v-model="form.extra_services" @change="debouncedSimulate" class="extra-services-checkboxes">
                      <el-checkbox 
                        v-for="srv in availableServices" 
                        :key="srv.service_code" 
                        :label="srv.service_code"
                      >
                        <span class="fw-bold">{{ srv.service_name }}</span>
                        <span class="text-xs text-muted block">
                          Phí: {{ srv.fee_type === 'FIXED' ? srv.fee_value.toLocaleString() + 'đ' : srv.fee_value + '%' }}
                          ({{ 
                            srv.calculation_base === 'DECLARED_VALUE' ? 'Theo giá trị đơn hàng' :
                            srv.calculation_base === 'MAIN_FEE' ? 'Theo cước chính' :
                            srv.calculation_base === 'COD_AMOUNT' ? 'Theo tiền thu hộ COD' :
                            srv.calculation_base === 'QUANTITY' ? 'Theo số lượng sản phẩm' :
                            'Theo vận đơn'
                          }})
                        </span>
                      </el-checkbox>
                    </el-checkbox-group>
                  </el-card>

                  <!-- bottom actions -->
                  <div class="form-actions-bottom" style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
                    <el-button @click="addToQueue" type="warning" plain size="large">
                      <el-icon class="mr-1"><FolderAdd /></el-icon>Đưa vào hàng chờ
                    </el-button>
                    <!-- <el-button @click="submitPickupRequest" type="primary" size="large" :loading="submitLoading">
                      <el-icon class="mr-1"><Upload /></el-icon>Gửi pickup
                    </el-button> -->
                  </div>
                </el-form>
              </el-col>

              <!-- Right side: Real-time estimated billing details -->
              <el-col v-if="!isBulkMail" :xs="24" :sm="24" :md="8">
                <el-card class="billing-summary-card mb-4 sticky-card" v-loading="simulateLoading">
                  <template #header>
                    <div class="billing-header text-primary fw-bold text-center">
                      ƯỚC TÍNH CƯỚC PHÍ
                    </div>
                  </template>
                  <div v-if="isBulkMail" class="bulk-mail-summary">
                    <el-icon><InfoFilled /></el-icon>
                    <strong>Chưa tính cước ở bước tạo yêu cầu</strong>
                    <p>Hệ thống sẽ tạo một mã túi gắn với khách hàng. Cước từng bưu gửi được xác định sau khi hoàn tất nhận dạng và cân đo tại bưu cục.</p>
                  </div>
                  <div class="billing-details" v-else-if="simulateResult">
                    <div class="billing-line">
                      <span>Cước chính:</span>
                      <span class="price-val">{{ (simulateResult.main_fee || 0).toLocaleString() }} đ</span>
                    </div>
                    <div class="billing-line" v-if="simulateResult.fuel_surcharge > 0">
                      <span>Phụ phí xăng dầu:</span>
                      <span class="price-val">{{ (simulateResult.fuel_surcharge || 0).toLocaleString() }} đ</span>
                    </div>
                    <div class="billing-line">
                      <span>Phí dịch vụ gia tăng:</span>
                      <span class="price-val">{{ (simulateResult.extra_fee || 0).toLocaleString() }} đ</span>
                    </div>
                    <div class="billing-line" v-if="simulateResult.packing_fee > 0">
                      <span>Phí đóng kiện:</span>
                      <span class="price-val">{{ (simulateResult.packing_fee || 0).toLocaleString() }} đ</span>
                    </div>
                    <div class="billing-line" v-if="simulateResult.remote_fee > 0">
                      <span>Phụ phí vùng xa:</span>
                      <span class="price-val">{{ (simulateResult.remote_fee || 0).toLocaleString() }} đ</span>
                    </div>
                    <div class="billing-line">
                      <span>Thuế VAT:</span>
                      <span class="price-val">{{ (simulateResult.vat || simulateResult.vat_8 || 0).toLocaleString() }} đ</span>
                    </div>
                    <el-divider class="my-3" />
                    <div class="billing-line total">
                      <span>TỔNG CỘNG TẠM TÍNH:</span>
                      <span class="price-val text-success">{{ (simulateResult.total || simulateResult.grand_total || 0).toLocaleString() }} đ</span>
                    </div>
                    <div class="text-xs text-muted mt-3 text-center">
                      * Cước phí thực tế sẽ được cập nhật sau khi bưu cục cân đo hàng hóa.
                    </div>
                  </div>
                  <div class="billing-error text-center text-warning" style="padding: 20px 10px;" v-else-if="simulateError">
                    <el-icon class="large-icon mb-2" style="font-size: 28px; color: #e6a23c;"><Warning /></el-icon>
                    <p style="font-size: 13px; font-weight: 500; color: #e6a23c;">{{ simulateError }}</p>
                    <p style="font-size: 11px; color: #909399; margin-top: 8px;">Vui lòng chọn Tỉnh đi / Tỉnh đến khác (ví dụ: Hà Nội $\leftrightarrow$ TP. Hồ Chí Minh) đã được cấu hình giá cước trong hệ thống.</p>
                  </div>
                  <div class="billing-placeholder text-center text-muted" v-else>
                    <el-icon class="large-icon mb-2"><InfoFilled /></el-icon>
                    <p>Vui lòng điền địa chỉ người gửi, người nhận và khối lượng hàng hóa để xem cước phí dự kiến.</p>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-col>
      </el-row>
      <input type="file" ref="excelInput" style="display: none;" accept=".xlsx, .xls" @change="handleExcelUpload" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/api/axios';
import { 
  User, DocumentAdd, Box, Setting, CircleCheck, InfoFilled, 
  ArrowLeft, Warning, Download, EditPen, FolderAdd, ArrowDown, Upload
} from '@element-plus/icons-vue';
import { parseExcelFile, processExcelRows } from '@/utils/excelParser';
import localProvincesData from '../../../assets/data/vietnam_provinces.json';

// ---- Dynamic Address API (provinces.open-api.vn) ----
const ADDR_API = 'https://provinces.open-api.vn/api';
const provinces = ref([]);
const senderProvinces = ref(localProvincesData);
const availableSenderWards = ref([]);
const selectedSenderProvinceCode = ref(null);
const selectedSenderWardCode = ref(null);
const senderLegacyLoading = ref(false);
const productTypes = ref([
  { code: 'DOCUMENT', label: 'Thư từ/Tài liệu', special_handling: false, requires_declared_value: false, packing_recommended: false, handling_note: 'Dùng cho thư từ, hồ sơ và tài liệu giấy.' },
  { code: 'PARCEL', label: 'Bưu phẩm, bưu kiện', special_handling: false, requires_declared_value: false, packing_recommended: false, handling_note: 'Dùng cho bưu phẩm và bưu kiện thông thường.' },
  { code: 'GENERAL', label: 'Hàng hóa thông thường', special_handling: false, requires_declared_value: false, packing_recommended: false, handling_note: 'Hàng hóa không thuộc nhóm cần xử lý đặc biệt.' },
  { code: 'LIQUID', label: 'Chất lỏng', special_handling: true, requires_declared_value: false, packing_recommended: true, handling_note: 'Cần bao gói chống rò rỉ và kiểm tra điều kiện vận chuyển.' },
  { code: 'ELECTRONIC', label: 'Điện tử', special_handling: true, requires_declared_value: false, packing_recommended: true, handling_note: 'Cần chống va đập; khai báo pin hoặc linh kiện hạn chế nếu có.' },
  { code: 'FOOD', label: 'Thực phẩm', special_handling: true, requires_declared_value: false, packing_recommended: true, handling_note: 'Cần khai báo điều kiện bảo quản và hạn sử dụng phù hợp.' },
  { code: 'HIGH_VALUE', label: 'Giá trị cao', special_handling: true, requires_declared_value: true, packing_recommended: true, handling_note: 'Bắt buộc khai giá lớn hơn 0 để kiểm soát và bảo hiểm hàng hóa.' }
]);

const fetchProductTypes = async () => {
  try {
    const res = await api.get('/api/waybills/product-types');
    if (res.data && res.data.items) {
      productTypes.value = res.data.items;
    }
  } catch (err) {
    console.error('Không thể tải danh sách loại hàng', err);
  }
};

const getProductTypeInfo = (code) => {
  return productTypes.value.find(pt => pt.code === code) || null;
};

const excelInput = ref(null);
const districtsCache = {};
const wardsCache = {};

const senderDistricts = ref([]);
const senderWards = ref([]);
const receiverDistricts = ref([]);
const receiverWards = ref([]);

const fetchProvinces = async () => {
  if (provinces.value.length) return;
  try {
    const res = await fetch(`${ADDR_API}/`);
    const data = await res.json();
    provinces.value = data.map(p => ({ id: p.code, name: p.name }));
  } catch (err) {
    console.error('Không thể tải danh sách tỉnh/thành phố', err);
  }
};

const fetchDistrictsForProvince = async (provinceId) => {
  if (!provinceId) return [];
  const pId = Number(provinceId);
  if (districtsCache[pId]) return districtsCache[pId];
  try {
    const res = await fetch(`${ADDR_API}/p/${pId}?depth=2`);
    const data = await res.json();
    const list = (data.districts || []).map(d => ({ id: d.code, name: d.name }));
    districtsCache[pId] = list;
    return list;
  } catch (err) {
    console.error('Không thể tải danh sách quận/huyện', err);
    return [];
  }
};

const fetchWardsForDistrict = async (districtId) => {
  if (!districtId) return [];
  const dId = Number(districtId);
  if (wardsCache[dId]) return wardsCache[dId];
  try {
    const res = await fetch(`${ADDR_API}/d/${dId}?depth=2`);
    const data = await res.json();
    const list = (data.wards || []).map(w => ({ id: w.code, name: w.name }));
    wardsCache[dId] = list;
    return list;
  } catch (err) {
    console.error('Không thể tải danh sách phường/xã', err);
    return [];
  }
};

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const customerInfo = ref({
  customer_code: '',
  phone_number: '',
  email: authStore.user?.email || '',
  address_detail: '',
  province: '',
  ward: '',
  street_address: '',
  old_province: ''
});

// Portal View States
const showCreateForm = ref(true);
const submitLoading = ref(false);
const simulateLoading = ref(false);
const draftsList = ref([]);
const savedDraftsList = ref([]);

// Available Extra Services List
const availableServices = ref([]);
const pickupModeOptions = [
  { label: 'Thư từ/Bưu phẩm hàng loạt', value: 'BULK_MAIL' }
];

// Form model
const form = reactive({
  pickup_mode: 'BULK_MAIL',
  bulk_product_type: 'DOCUMENT',
  bulk_estimated_quantity: 1,
  bulk_draft_items: [
    { local_id: Date.now(), receiver_name: '', receiver_phone: '', receiver_address: '', customer_reference_code: '', note: '' }
  ],
  sender: {
    name: '',
    phone: '',
    province: '',
    ward: '',
    street_address: '',
    address_detail: '',
    old_province: ''
  },
  receiver: {
    name: '',
    phone: '',
    province_id: null,
    district_id: null,
    ward_id: null,
    address_detail: ''
  },
  items: [
    {
      product_group: 'PARCEL',
      product_name: '',
      weight: 0.5,
      length: 0,
      width: 0,
      height: 0,
      quantity: 1,
      declared_value: 0
    }
  ],
  cod_amount: 0,
  cod_receiver_pays_fee: false,
  service_type: 'CPN',
  extra_services: [],
  packing_type: null,
  delivery_note_option: 'CHO_XEM_HANG',
  note: '',
  payment_method: 'SENDER_DEBT',
  target_hub_id: null,
  department: '',
  customer_department_id: null
});

const isDirty = ref(false);
const isLoaded = ref(false);

watch(form, () => {
  if (isLoaded.value) {
    isDirty.value = true;
  }
}, { deep: true });

const hubsList = ref([]);
const departmentsList = ref([]);
const loadDepartments = async () => {
  try {
    const res = await api.get('/api/customers/me/departments');
    departmentsList.value = res.data || [];
    // Backward compatibility for drafts
    if (form.department && !form.customer_department_id) {
      const match = departmentsList.value.find(d => d.name.toLowerCase() === form.department.toLowerCase());
      if (match) {
        form.customer_department_id = match.id;
      }
    }
  } catch (err) {
    console.error('Lỗi khi tải danh sách phòng ban:', err);
  }
};

const isBulkMail = computed(() => form.pickup_mode === 'BULK_MAIL');
const bulkProductTypes = computed(() => productTypes.value.filter(type => ['DOCUMENT', 'PARCEL'].includes(type.code)));
const isSingleBulkMail = computed(() => isBulkMail.value && Number(form.bulk_estimated_quantity) === 1);
const bulkMailInstruction = computed(() => isSingleBulkMail.value
  ? 'Bạn có thể nhập trước thông tin người nhận hoặc để trống để hệ thống OCR bổ sung sau.'
  : 'Từ 2 bưu gửi trở lên, hệ thống tạo một túi thư cha. Mã vận đơn và thông tin người nhận từng bưu gửi sẽ được mobile/OCR bổ sung sau.'
);

const createBulkDraftItem = () => ({
  local_id: `${Date.now()}-${Math.random()}`,
  receiver_name: '',
  receiver_phone: '',
  receiver_address: '',
  customer_reference_code: '',
  note: ''
});

const syncBulkDraftItems = (quantity) => {
  const target = Math.max(1, Number(quantity || 1));
  if (!Array.isArray(form.bulk_draft_items)) form.bulk_draft_items = [];
  if (form.bulk_draft_items.length === 0) {
    form.bulk_draft_items.push(createBulkDraftItem());
  }
  if (form.bulk_draft_items.length > target) {
    form.bulk_draft_items.splice(target);
  }
};

const addBulkDraftItem = () => {
  if (form.bulk_draft_items.length >= 10000) return;
  form.bulk_draft_items.push(createBulkDraftItem());
  form.bulk_estimated_quantity = Math.max(form.bulk_estimated_quantity, form.bulk_draft_items.length);
};

const removeBulkDraftItem = (index) => {
  form.bulk_draft_items.splice(index, 1);
  if (form.bulk_estimated_quantity < form.bulk_draft_items.length) {
    form.bulk_estimated_quantity = Math.max(1, form.bulk_draft_items.length);
  }
};

watch(() => form.bulk_estimated_quantity, syncBulkDraftItems);
const isExpressService = computed(() => ['HT', 'EXPRESS'].includes(form.service_type));

watch(isBulkMail, (bulk) => {
  if (bulk) {
    simulateResult.value = null;
    simulateError.value = '';
  } else {
    debouncedSimulate();
  }
});

// Simulation price result
const simulateResult = ref(null);
const simulateError = ref('');

const getProvinceName = (id) => provinces.value.find(p => Number(p.id) === Number(id))?.name || '';

const getDistrictName = (provId, distId) => {
  if (!provId || !distId) return '';
  const cached = districtsCache[Number(provId)];
  if (cached) {
    return cached.find(d => Number(d.id) === Number(distId))?.name || '';
  }
  const activeLists = [senderDistricts.value, receiverDistricts.value];
  for (const list of activeLists) {
    const found = list.find(d => Number(d.id) === Number(distId));
    if (found) return found.name;
  }
  return '';
};

const getWardName = (distId, wardId) => {
  if (!distId || !wardId) return '';
  const cached = wardsCache[Number(distId)];
  if (cached) {
    return cached.find(w => Number(w.id) === Number(wardId))?.name || '';
  }
  const activeLists = [senderWards.value, receiverWards.value];
  for (const list of activeLists) {
    const found = list.find(w => Number(w.id) === Number(wardId));
    if (found) return found.name;
  }
  return '';
};

const OLD_PROVINCE_CODE_MAP = {
  1: 'Thành phố Hà Nội', 2: 'Tỉnh Hà Giang', 4: 'Tỉnh Cao Bằng',
  6: 'Tỉnh Bắc Kạn', 8: 'Tỉnh Tuyên Quang', 10: 'Tỉnh Lào Cai',
  11: 'Tỉnh Điện Biên', 12: 'Tỉnh Lai Châu', 14: 'Tỉnh Sơn La',
  15: 'Tỉnh Yên Bái', 17: 'Tỉnh Hòa Bình', 19: 'Tỉnh Thái Nguyên',
  20: 'Tỉnh Lạng Sơn', 22: 'Tỉnh Quảng Ninh', 24: 'Tỉnh Bắc Giang',
  25: 'Tỉnh Phú Thọ', 26: 'Tỉnh Vĩnh Phúc', 27: 'Tỉnh Bắc Ninh',
  30: 'Tỉnh Hải Dương', 31: 'Thành phố Hải Phòng', 33: 'Tỉnh Hưng Yên',
  34: 'Tỉnh Thái Bình', 35: 'Tỉnh Hà Nam', 36: 'Tỉnh Nam Định',
  37: 'Tỉnh Ninh Bình', 38: 'Tỉnh Thanh Hóa', 40: 'Tỉnh Nghệ An',
  42: 'Tỉnh Hà Tĩnh', 44: 'Tỉnh Quảng Bình', 45: 'Tỉnh Quảng Trị',
  46: 'Tỉnh Thừa Thiên Huế', 48: 'Thành phố Đà Nẵng', 49: 'Tỉnh Quảng Nam',
  51: 'Tỉnh Quảng Ngãi', 52: 'Tỉnh Bình Định', 54: 'Tỉnh Phú Yên',
  56: 'Tỉnh Khánh Hòa', 58: 'Tỉnh Ninh Thuận', 60: 'Tỉnh Bình Thuận',
  62: 'Tỉnh Kon Tum', 64: 'Tỉnh Gia Lai', 66: 'Tỉnh Đắk Lắk',
  67: 'Tỉnh Đắk Nông', 68: 'Tỉnh Lâm Đồng', 70: 'Tỉnh Bình Phước',
  72: 'Tỉnh Tây Ninh', 74: 'Tỉnh Bình Dương', 75: 'Tỉnh Đồng Nai',
  77: 'Tỉnh Bà Rịa - Vũng Tàu', 79: 'Thành phố Hồ Chí Minh', 80: 'Tỉnh Long An',
  82: 'Tỉnh Tiền Giang', 83: 'Tỉnh Bến Tre', 84: 'Tỉnh Trà Vinh',
  86: 'Tỉnh Vĩnh Long', 87: 'Tỉnh Đồng Tháp', 89: 'Tỉnh An Giang',
  91: 'Tỉnh Kiên Giang', 92: 'Thành phố Cần Thơ', 93: 'Tỉnh Hậu Giang',
  94: 'Tỉnh Sóc Trăng', 95: 'Tỉnh Bạc Liêu', 96: 'Tỉnh Cà Mau'
};

const handleSenderProvinceChange = (code) => {
  const found = senderProvinces.value.find(p => p.Code === code);
  form.sender.province = found ? found.FullName : '';
  form.sender.ward = '';
  form.sender.old_province = '';
  selectedSenderWardCode.value = null;
  availableSenderWards.value = found ? found.Wards : [];
  debouncedSimulate();
};

const handleSenderWardChange = async (wardCode) => {
  if (!wardCode) {
    form.sender.ward = '';
    form.sender.old_province = '';
    debouncedSimulate();
    return;
  }

  const wardObj = availableSenderWards.value.find(w => w.Code === wardCode);
  form.sender.ward = wardObj ? wardObj.FullName : '';

  senderLegacyLoading.value = true;
  try {
    const res = await fetch(`https://provinces.open-api.vn/api/v2/w/${wardCode}/to-legacies/`);
    if (!res.ok) throw new Error();
    const legacies = await res.json();
    if (Array.isArray(legacies) && legacies.length > 0) {
      const code = legacies[0].province_code;
      form.sender.old_province = OLD_PROVINCE_CODE_MAP[code] || form.sender.province;
    } else {
      form.sender.old_province = form.sender.province;
    }
  } catch (err) {
    form.sender.old_province = form.sender.province;
  } finally {
    senderLegacyLoading.value = false;
    debouncedSimulate();
  }
};

const getSenderProvinceId = () => {
  if (!form.sender.province) return null;
  const cleanProv = form.sender.province.replace(/^(Tỉnh|Thành phố|TP\.)\s+/i, '').trim().toLowerCase();
  const found = provinces.value.find(p => {
    const pName = p.name.replace(/^(Tỉnh|Thành phố|TP\.)\s+/i, '').trim().toLowerCase();
    return pName === cleanProv;
  });
  return found ? found.id : null;
};

const goToProfileTab = () => {
  router.push('/customer/portal?tab=profile');
};

const validateForm = () => {
  // Validate sender (khách hàng có thể sửa đổi trên form)
  if (!form.sender.name || !form.sender.phone || !form.sender.province || !form.sender.ward || !form.sender.street_address) {
    ElMessage.warning('Vui lòng điền đầy đủ thông tin địa chỉ người gửi (Họ tên, SĐT, Tỉnh, Xã, Số nhà/đường).');
    return false;
  }

  if (isBulkMail.value) {
    if (!productTypes.value.some(type => type.code === form.bulk_product_type) || Number(form.bulk_estimated_quantity) < 1) {
      ElMessage.warning('Vui lòng chọn loại bưu gửi và nhập số lượng dự kiến.');
      return false;
    }
  } else {
    if (!form.receiver.name || !form.receiver.phone || !form.receiver.province_id || !form.receiver.district_id) {
      ElMessage.warning('Vui lòng điền đủ thông tin người nhận trước khi tạo đơn.');
      return false;
    }
    if (!form.items[0].product_name) {
      ElMessage.warning('Vui lòng điền đủ thông tin cơ bản trước khi tạo đơn.');
      return false;
    }

    // Validate items
    for (let i = 0; i < form.items.length; i++) {
      const item = form.items[i];
      if (!item.product_group) {
        ElMessage.warning(`Vui lòng chọn loại hàng cho sản phẩm thứ ${i + 1}.`);
        return false;
      }
      if (item.weight === undefined || item.weight === null || item.weight === '' || Number(item.weight) <= 0) {
        ElMessage.warning(`Khối lượng sản phẩm thứ ${i + 1} phải lớn hơn 0.`);
        return false;
      }
      if (item.quantity === undefined || item.quantity === null || item.quantity === '' || Number(item.quantity) < 1) {
        ElMessage.warning(`Số lượng sản phẩm thứ ${i + 1} phải lớn hơn hoặc bằng 1.`);
        return false;
      }
      if (item.declared_value === undefined || item.declared_value === null || item.declared_value === '' || Number(item.declared_value) < 0) {
        ElMessage.warning(`Giá trị khai báo sản phẩm thứ ${i + 1} phải lớn hơn hoặc bằng 0.`);
        return false;
      }
      if (item.product_group === 'HIGH_VALUE' && (!item.declared_value || Number(item.declared_value) <= 0)) {
        ElMessage.warning('Hàng giá trị cao bắt buộc phải có giá trị khai báo lớn hơn 0.');
        return false;
      }
    }
  }
  return true;
};

const submitPickupRequest = async () => {
  if (!validateForm()) return;

  submitLoading.value = true;
  try {
    const selectedDept = departmentsList.value.find(d => d.id === form.customer_department_id);
    const deptPrefix = selectedDept ? `[Phòng ban: ${selectedDept.name}] ` : '';

    const senderAddr = form.sender.address_detail || [
      form.sender.street_address,
      form.sender.ward,
      form.sender.province,
      'Việt Nam'
    ].filter(Boolean).join(', ');

    if (isBulkMail.value) {
      const draftItems = (form.bulk_draft_items || []).map((item, index) => ({
        sequence_no: index + 1,
        customer_reference_code: item.customer_reference_code || null,
        receiver_name: item.receiver_name || null,
        receiver_phone: item.receiver_phone || null,
        receiver_address: item.receiver_address || null,
        note: item.note || null
      }));
      const firstMail = draftItems[0] || {};
      const hasReceiver = Number(form.bulk_estimated_quantity) === 1 && (
        firstMail.receiver_name || firstMail.receiver_phone || firstMail.receiver_address
      );

      const payload = {
        product_type: ['DOCUMENT', 'PARCEL'].includes(form.bulk_product_type) ? form.bulk_product_type : 'PARCEL',
        service_type: form.service_type || 'TK',
        payment_method: form.payment_method || 'SENDER_DEBT',
        estimated_quantity: Number(form.bulk_estimated_quantity),
        sender: {
          name: form.sender.name,
          phone: form.sender.phone,
          address: senderAddr,
          province_id: null,
          district_id: null,
          ward_id: null,
          province_name: form.sender.province || null,
          district_name: null,
          ward_name: form.sender.ward || null,
          old_province: form.sender.old_province || form.sender.province || null
        },
        receiver: hasReceiver ? {
          name: firstMail.receiver_name || null,
          phone: firstMail.receiver_phone || null,
          address: firstMail.receiver_address || '',
        } : null,
        draft_items: draftItems,
        target_hub_id: form.target_hub_id || null,
        note: deptPrefix + (form.note || '') || null,
        customer_department_id: form.customer_department_id || null
      };

      await api.post('/api/waybills/customer/bulk-mail-pickups', payload);
      ElMessage.success('Tạo yêu cầu gửi hàng hàng loạt thành công!');
    } else {
      const rName = getProvinceName(form.receiver.province_id);
      const rDist = getDistrictName(form.receiver.province_id, form.receiver.district_id);
      const rWrd = getWardName(form.receiver.district_id, form.receiver.ward_id);

      const mappedExtra = form.extra_services.map(code => {
        const srv = availableServices.value.find(s => s.service_code === code);
        return {
          service_code: code,
          service_name: srv ? srv.service_name : '',
          service_fee: srv ? (srv.fee_type === 'FIXED' ? srv.fee_value : 0) : 0
        };
      });

      const payload = {
        order_type: 'DOMESTIC',
        sender: {
          name: form.sender.name,
          phone: form.sender.phone,
          address: senderAddr,
          province_id: null,
          district_id: null,
          ward_id: null,
          province_name: form.sender.province || null,
          district_name: null,
          ward_name: form.sender.ward || null,
          old_province: form.sender.old_province || form.sender.province || null
        },
        receiver: {
          name: form.receiver.name,
          phone: form.receiver.phone,
          address: [form.receiver.address_detail, rWrd, rDist, rName].filter(Boolean).join(', '),
          province_id: Number(form.receiver.province_id),
          district_id: Number(form.receiver.district_id),
          ward_id: Number(form.receiver.ward_id),
          province_name: rName,
          district_name: rDist,
          ward_name: rWrd,
          old_province: receiverOldProvinceName.value || rName
        },
        items: form.items.map(i => ({
          product_group: i.product_group || 'PARCEL',
          product_name: i.product_name,
          weight: Number(i.weight),
          length: Number(i.length || 0),
          width: Number(i.width || 0),
          height: Number(i.height || 0),
          quantity: Number(i.quantity || 1),
          declared_value: Number(i.declared_value || 0)
        })),
        cod_amount: Number(form.cod_amount || 0),
        cod_receiver_pays_fee: form.cod_receiver_pays_fee,
        service_type: form.service_type,
        extra_services: mappedExtra,
        delivery_note_option: form.delivery_note_option,
        note: deptPrefix + (form.note || ''),
        payment_method: form.payment_method,
        pickup_method: 'OUR_STAFF_PICKUP',
        delivery_method: 'OUR_STAFF_DELIVERY',
        target_hub_id: form.target_hub_id || null,
        save_as_draft: false,
        customer_department_id: form.customer_department_id || null
      };

      const res = await api.post('/api/waybills/customer/pickups', payload);
      ElMessage.success(`Tạo yêu cầu thành công! Mã vận đơn: ${res.data.waybill_code}`);
      saveToAddressBook(form.receiver);
    }

    const resumeDraftId = route.query.resume_draft_id;
    if (resumeDraftId) {
      draftsList.value = draftsList.value.filter(d => d.draft_id !== resumeDraftId);
      savedDraftsList.value = savedDraftsList.value.filter(d => d.draft_id !== resumeDraftId);
      localStorage.setItem('customer_pickup_queue', JSON.stringify(draftsList.value));
      localStorage.setItem('customer_pickup_drafts', JSON.stringify(savedDraftsList.value));
    }

    isDirty.value = false;
    router.push('/customer/orders');
  } catch (err) {
    console.error('Lỗi khi gửi yêu cầu lấy hàng:', err);
    let errorMsg = 'Có lỗi xảy ra khi tạo yêu cầu lấy hàng.';
    if (err.response && err.response.data) {
      if (Array.isArray(err.response.data.detail)) {
        errorMsg = err.response.data.detail.map(d => d.msg).join(', ');
      } else if (err.response.data.detail) {
        errorMsg = err.response.data.detail;
      }
    }
    ElMessage.error(errorMsg);
  } finally {
    submitLoading.value = false;
  }
};

const receiverOldProvinceName = ref('');
const receiverLegacyLoading = ref(false);



const handleReceiverWardChange = async (wardId) => {
  if (!wardId) {
    receiverOldProvinceName.value = '';
    return;
  }
  receiverLegacyLoading.value = true;
  try {
    const res = await fetch(`https://provinces.open-api.vn/api/v2/w/${wardId}/to-legacies/`);
    if (!res.ok) throw new Error();
    const legacies = await res.json();
    if (Array.isArray(legacies) && legacies.length > 0) {
      const code = legacies[0].province_code;
      receiverOldProvinceName.value = OLD_PROVINCE_CODE_MAP[code] || getProvinceName(form.receiver.province_id);
    } else {
      receiverOldProvinceName.value = getProvinceName(form.receiver.province_id);
    }
  } catch (err) {
    receiverOldProvinceName.value = getProvinceName(form.receiver.province_id);
  } finally {
    receiverLegacyLoading.value = false;
  }
};

const normalizeAddressText = (value = '') => value
  .toString()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()
  .trim();

const isActiveHub = (hub) => hub?.status === true || hub?.status === 1 || hub?.status === 'ACTIVE';

const activeHubsList = computed(() => hubsList.value.filter(isActiveHub));

const autoProcessingHub = computed(() => {
  const provinceId = Number(getSenderProvinceId() || 0);
  if (!provinceId) return null;

  const activeHubs = activeHubsList.value;
  const exactMatch = activeHubs.find(hub => Number(hub.province_id) === provinceId);
  if (exactMatch) return exactMatch;

  const provinceName = normalizeAddressText(getProvinceName(provinceId));
  if (!provinceName) return null;

  return activeHubs.find((hub) => {
    const hubText = normalizeAddressText(`${hub.hub_name || ''} ${hub.address_detail || ''}`);
    return hubText.includes(provinceName);
  }) || null;
});

const syncAutoProcessingHub = () => {
  form.target_hub_id = autoProcessingHub.value?.hub_id || null;
};

watch(autoProcessingHub, syncAutoProcessingHub);



const handleReceiverProvinceChange = async () => {
  form.receiver.district_id = null;
  form.receiver.ward_id = null;
  receiverWards.value = [];
  if (form.receiver.province_id) {
    receiverDistricts.value = await fetchDistrictsForProvince(form.receiver.province_id);
  } else {
    receiverDistricts.value = [];
  }
  debouncedSimulate();
};

const handleReceiverDistrictChange = async () => {
  form.receiver.ward_id = null;
  if (form.receiver.district_id) {
    receiverWards.value = await fetchWardsForDistrict(form.receiver.district_id);
  } else {
    receiverWards.value = [];
  }
};

const mapStandardProvinceToHubProvince = (standardId, targetHubId = null) => {
  const id = Number(standardId);
  return {
    province_id: id || null,
    province_name: getProvinceName(id)
  };
};

// SIMULATE ESTIMATED SHIPPING FEE
let simulateTimeout = null;
const debouncedSimulate = () => {
  if (simulateTimeout) clearTimeout(simulateTimeout);
  simulateTimeout = setTimeout(triggerSimulation, 400);
};

const triggerSimulation = async () => {
  if (isBulkMail.value) {
    simulateResult.value = null;
    simulateError.value = '';
    return;
  }
  const senderProvinceId = getSenderProvinceId();
  if (!senderProvinceId || !form.receiver.province_id) {
    simulateResult.value = null;
    return;
  }
  
  const validItems = form.items.filter(item => Number(item.weight || 0) > 0);
  if (!validItems.length) {
    simulateResult.value = null;
    simulateError.value = '';
    return;
  }
  
  simulateLoading.value = true;
  simulateError.value = '';
  try {
    const mappedSender = mapStandardProvinceToHubProvince(senderProvinceId, form.target_hub_id);
    const mappedReceiver = mapStandardProvinceToHubProvince(form.receiver.province_id);

    const actualWeight = validItems.reduce((total, item) => {
      return total + (Number(item.weight || 0) * Number(item.quantity || 1));
    }, 0);
    const convertedWeight = validItems.reduce((total, item) => {
      if (!item.length || !item.width || !item.height) return total;
      return total + ((Number(item.length) * Number(item.width) * Number(item.height)) / 5000) * Number(item.quantity || 1);
    }, 0);
    const chargeWeight = Math.max(actualWeight, convertedWeight, 0.01);
    const declaredValue = validItems.reduce((total, item) => {
      return total + (Number(item.declared_value || 0) * Number(item.quantity || 1));
    }, 0);
    const totalQuantity = validItems.reduce((total, item) => total + Number(item.quantity || 1), 0);

    const payload = {
      origin_province_id: Number(mappedSender.province_id),
      dest_province_id: Number(mappedReceiver.province_id),
      weight: Number(chargeWeight.toFixed(2)),
      length: 0,
      width: 0,
      height: 0,
      service_type: form.service_type,
      cod_amount: Number(form.cod_amount || 0),
      declared_value: declaredValue,
      quantity: totalQuantity,
      packing_type: form.packing_type || null,
      extra_services: form.extra_services
    };
    
    const res = await api.post('/api/pricing/simulate', payload);
    if (res.data && res.data.status === 'SUCCESS') {
      simulateResult.value = res.data;
    } else {
      simulateResult.value = null;
      simulateError.value = 'Không thể tính phí tự động.';
    }
  } catch (err) {
    console.error('Error simulating price:', err);
    simulateResult.value = null;
    simulateError.value = err.response?.data?.detail || 'Tuyến đường này chưa được cấu hình giá cước.';
  } finally {
    simulateLoading.value = false;
  }
};

const fetchAvailableServices = async () => {
  try {
    const res = await api.get('/api/pricing/extra-services');
    availableServices.value = res.data || [];
  } catch (err) {
    console.error('Error fetching extra services:', err);
  }
};

const fetchHubs = async () => {
  try {
    const res = await api.get('/api/hubs');
    hubsList.value = Array.isArray(res.data) ? res.data : (res.data.items || res.data.data || []);
  } catch (err) {
    console.error('Error fetching hubs:', err);
  }
};

const saveDraft = () => {
  const resumeDraftId = route.query.resume_draft_id;
  if (resumeDraftId) {
    savedDraftsList.value = savedDraftsList.value.filter(d => d.draft_id !== resumeDraftId);
    draftsList.value = draftsList.value.filter(d => d.draft_id !== resumeDraftId);
    localStorage.setItem('customer_pickup_queue', JSON.stringify(draftsList.value));
  }

  if (savedDraftsList.value.length >= 20) {
    ElMessage.warning('Chỉ lưu tối đa 20 bản nháp! Vui lòng xóa bớt.');
    return;
  }
  syncAutoProcessingHub();
  
  const newDraft = {
    ...JSON.parse(JSON.stringify(form)),
    draft_id: Date.now().toString(),
    created_at: new Date().toISOString()
  };

  savedDraftsList.value.push(newDraft);
  localStorage.setItem('customer_pickup_drafts', JSON.stringify(savedDraftsList.value));
  ElMessage.success('Đã lưu bản nháp thành công!');

  isDirty.value = false;

  if (resumeDraftId) {
    router.replace({ query: {} });
  }
};

const addToQueue = () => {
  const resumeDraftId = route.query.resume_draft_id;
  if (resumeDraftId) {
    draftsList.value = draftsList.value.filter(d => d.draft_id !== resumeDraftId);
    savedDraftsList.value = savedDraftsList.value.filter(d => d.draft_id !== resumeDraftId);
    localStorage.setItem('customer_pickup_drafts', JSON.stringify(savedDraftsList.value));
  }

  if (draftsList.value.length >= 10) {
    ElMessage.warning('Hàng chờ chỉ lưu tối đa 10 đơn! Vui lòng xóa bớt hoặc gửi yêu cầu.');
    return;
  }
  
  if (!validateForm()) return;

  syncAutoProcessingHub();

  const newDraft = {
    ...JSON.parse(JSON.stringify(form)),
    draft_id: Date.now().toString(),
    created_at: new Date().toISOString()
  };

  draftsList.value.push(newDraft);
  localStorage.setItem('customer_pickup_queue', JSON.stringify(draftsList.value));
  localStorage.removeItem('customer_pickup_draft');
  
  ElMessage.success(`Đã đưa vào hàng chờ đơn thứ ${draftsList.value.length}. Bạn có thể tiếp tục tạo đơn mới.`);

  // Auto save to recipient book
  saveToAddressBook(form.receiver);

  isLoaded.value = false;

  form.receiver.name = '';
  form.receiver.phone = '';
  form.receiver.province_id = null;
  form.receiver.district_id = null;
  form.receiver.ward_id = null;
  form.receiver.address_detail = '';
  receiverDistricts.value = [];
  receiverWards.value = [];

  form.items = [{ product_group: 'PARCEL', product_name: '', weight: 0.5, length: 0, width: 0, height: 0, quantity: 1, declared_value: 0 }];
  form.cod_amount = 0;
  form.note = '';

  // Reset bulk mail items
  form.bulk_estimated_quantity = 1;
  form.bulk_draft_items = [
    { local_id: Date.now(), receiver_name: '', receiver_phone: '', receiver_address: '', customer_reference_code: '', note: '' }
  ];

  setTimeout(() => {
    isLoaded.value = true;
    isDirty.value = false;
  }, 100);

  if (resumeDraftId) {
    router.replace({ query: {} });
  }
};

const loadDrafts = () => {
  try {
    const storedQueue = localStorage.getItem('customer_pickup_queue');
    if (storedQueue) {
      draftsList.value = JSON.parse(storedQueue);
    }
  } catch (e) {
    console.error('Lỗi khi tải hàng chờ', e);
  }
  
  try {
    const storedDrafts = localStorage.getItem('customer_pickup_drafts');
    if (storedDrafts) {
      savedDraftsList.value = JSON.parse(storedDrafts);
    }
  } catch (e) {
    console.error('Lỗi khi tải bản nháp', e);
  }
};

const triggerExcelImport = () => {
  excelInput.value.click();
};

const handleExcelUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    if (provinces.value.length === 0) {
      await fetchProvinces();
    }

    ElMessage.info('Đang đọc file Excel...');
    const rawRows = await parseExcelFile(file);

    if (rawRows.length === 0) {
      ElMessage.warning('File Excel không có dữ liệu.');
      return;
    }

    ElMessage.info(`Đang phân tích ${rawRows.length} dòng dữ liệu...`);

    const defaultSender = {
      name: form.sender?.name || authStore.user?.full_name || customerInfo.value?.transaction_name || '',
      phone: form.sender?.phone || customerInfo.value?.phone_number || '',
      province_id: form.sender?.province_id || customerInfo.value?.province_id || null,
      district_id: form.sender?.district_id || customerInfo.value?.district_id || null,
      ward_id: form.sender?.ward_id || customerInfo.value?.ward_id || null,
      address_detail: form.sender?.address_detail || customerInfo.value?.address_detail || ''
    };

    const importedDrafts = await processExcelRows({
      rawRows,
      provincesList: provinces.value,
      fetchDistricts: fetchDistrictsForProvince,
      fetchWards: fetchWardsForDistrict,
      districtsCache,
      wardsCache,
      defaultSender,
      targetHubId: form.target_hub_id
    });

    if (importedDrafts.length === 0) {
      ElMessage.warning('Không phân tích được đơn hàng hợp lệ nào từ file Excel.');
      event.target.value = '';
      return;
    }

    try {
      await ElMessageBox.confirm(
        `Hệ thống đã đọc và phân tích thành công ${importedDrafts.length} đơn hàng hợp lệ từ file Excel. Bạn có muốn đưa ${importedDrafts.length} đơn hàng này vào hàng chờ không?`,
        'Xác nhận nhập dữ liệu',
        {
          confirmButtonText: 'Đồng ý',
          cancelButtonText: 'Hủy',
          type: 'success'
        }
      );
    } catch (e) {
      ElMessage.info('Đã hủy nhập dữ liệu từ Excel');
      event.target.value = '';
      return;
    }

    draftsList.value.push(...importedDrafts);
    localStorage.setItem('customer_pickup_queue', JSON.stringify(draftsList.value));

    ElMessage.success(`Nhập thành công ${importedDrafts.length} đơn vào hàng chờ.`);
    event.target.value = '';

    router.push('/customer/queue');
  } catch (err) {
    console.error(err);
    ElMessage.error('Có lỗi xảy ra khi đọc file Excel. Vui lòng kiểm tra lại cấu trúc file.');
  }
};

const downloadTemplate = () => {
  const link = document.createElement('a');
  link.href = '/template-import.xlsx';
  link.download = 'template-import.xlsx';
  link.click();
};

// ---- Local Storage Address Book Suggestions ----
const nameAutocomplete = ref(null);
const phoneAutocomplete = ref(null);

const handleTriggerName = () => {
  if (nameAutocomplete.value) {
    // Force open suggestion box by focusing it
    nameAutocomplete.value.focus();
  }
};

const handleTriggerPhone = () => {
  if (phoneAutocomplete.value) {
    // Force open suggestion box by focusing it
    phoneAutocomplete.value.focus();
  }
};

const storageKey = computed(() => 'customer_recipients_' + (authStore.user?.id || authStore.user?.username || 'global'));

const getSavedRecipients = () => {
  try {
    const raw = localStorage.getItem(storageKey.value);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading recipients from local storage', e);
    return [];
  }
};

const queryReceiverByName = (queryString, cb) => {
  const list = getSavedRecipients();
  const results = queryString
    ? list.filter(item => item.name && item.name.toLowerCase().includes(queryString.toLowerCase()))
    : list;
  cb(results);
};

const queryReceiverByPhone = (queryString, cb) => {
  const list = getSavedRecipients();
  const results = queryString
    ? list.filter(item => item.phone && item.phone.includes(queryString))
    : list;
  cb(results);
};

const handleSelectReceiver = async (item) => {
  form.receiver.name = item.name || '';
  form.receiver.phone = item.phone || '';
  form.receiver.province_id = item.province_id || null;
  
  if (item.province_id) {
    receiverDistricts.value = await fetchDistrictsForProvince(item.province_id);
    form.receiver.district_id = item.district_id || null;
  } else {
    receiverDistricts.value = [];
    form.receiver.district_id = null;
  }
  
  if (item.district_id) {
    receiverWards.value = await fetchWardsForDistrict(item.district_id);
    form.receiver.ward_id = item.ward_id || null;
  } else {
    receiverWards.value = [];
    form.receiver.ward_id = null;
  }
  
  form.receiver.address_detail = item.address_detail || '';
  
  debouncedSimulate();
};

const saveToAddressBook = (receiver) => {
  if (!receiver.name || !receiver.phone || !receiver.province_id) return;
  const list = getSavedRecipients();
  const index = list.findIndex(item => item.phone === receiver.phone);
  if (index >= 0) {
    list[index] = {
      ...list[index],
      name: receiver.name,
      province_id: receiver.province_id,
      district_id: receiver.district_id,
      ward_id: receiver.ward_id,
      address_detail: receiver.address_detail
    };
  } else {
    list.push({
      id: Date.now().toString(),
      name: receiver.name,
      phone: receiver.phone,
      province_id: receiver.province_id,
      district_id: receiver.district_id,
      ward_id: receiver.ward_id,
      address_detail: receiver.address_detail,
      created_at: new Date().toISOString()
    });
  }
  localStorage.setItem(storageKey.value, JSON.stringify(list));
};

const hasUnsavedData = () => {
  return isDirty.value && showCreateForm.value;
};

const promptSaveDraft = () => {
  return new Promise((resolve) => {
    if (!hasUnsavedData()) {
      resolve(true);
      return;
    }

    ElMessageBox.confirm(
      'Nếu bạn rời khỏi thì dữ liệu nhập hiện tại sẽ mất, bạn có muốn lưu nháp không?',
      'Cảnh báo mất dữ liệu',
      {
        confirmButtonText: 'Lưu nháp',
        cancelButtonText: 'Không lưu',
        type: 'warning',
        distinguishCancelAndClose: true,
        showClose: true,
      }
    )
      .then(() => {
        saveDraft();
        resolve(true);
      })
      .catch((action) => {
        if (action === 'cancel') {
          resolve(true);
        } else {
          resolve(false);
        }
      });
  });
};

const cancelCreate = async () => {
  const allow = await promptSaveDraft();
  if (allow) {
    showCreateForm.value = false;
    router.push({ query: { tab: 'dashboard' } });
  }
};

onBeforeRouteLeave(async (to, from, next) => {
  const allow = await promptSaveDraft();
  if (allow) {
    next();
  } else {
    next(false);
  }
});

const handleBeforeUnload = (event) => {
  if (hasUnsavedData()) {
    event.preventDefault();
    event.returnValue = 'Nếu bạn rời khỏi thì dữ liệu nhập hiện tại sẽ mất.';
    return event.returnValue;
  }
};

onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload);
  if (!authStore.user) return;

  loadDrafts();
  loadDepartments();

  await fetchProvinces();
  await fetchProductTypes();

  const resumeDraftId = route.query.resume_draft_id;
  if (resumeDraftId) {
    const storedQueue = localStorage.getItem('customer_pickup_queue');
    const storedDrafts = localStorage.getItem('customer_pickup_drafts');
    let found = null;
    if (storedQueue) {
      const parsed = JSON.parse(storedQueue);
      found = parsed.find(d => d.draft_id === resumeDraftId);
    }
    if (!found && storedDrafts) {
      const parsed = JSON.parse(storedDrafts);
      found = parsed.find(d => d.draft_id === resumeDraftId);
    }
    if (found) {
      Object.assign(form, JSON.parse(JSON.stringify(found)));
      syncBulkDraftItems(form.bulk_estimated_quantity || 1);
      if (form.sender.province_id) senderDistricts.value = await fetchDistrictsForProvince(form.sender.province_id);
      if (form.sender.district_id) senderWards.value = await fetchWardsForDistrict(form.sender.district_id);
      if (form.receiver.province_id) receiverDistricts.value = await fetchDistrictsForProvince(form.receiver.province_id);
      if (form.receiver.district_id) receiverWards.value = await fetchWardsForDistrict(form.receiver.district_id);
      debouncedSimulate();
      showCreateForm.value = true;
      
      fetchAvailableServices();
      fetchHubs();
      return;
    }
  }

  let activeUser = authStore.user;
  try {
    const meRes = await api.get('/api/auth/me');
    if (meRes.data) {
      activeUser = {
        ...authStore.user,
        ...meRes.data
      };
      authStore.user = activeUser;
      localStorage.setItem('user', JSON.stringify(activeUser));
    }
  } catch (err) {
    console.error('Không thể gọi API /api/auth/me', err);
  }

  try {
    const res = await api.get('/api/customers/me');
    customerInfo.value = {
      ...customerInfo.value,
      ...res.data,
      phone_number: res.data.phone_number || res.data.phone || activeUser.phone_number || '',
      email: res.data.email || activeUser.email || ''
    };

    form.sender.name = activeUser.full_name || customerInfo.value.transaction_name || '';
    form.sender.phone = customerInfo.value.phone_number || '';
    form.sender.province = customerInfo.value.province || '';
    form.sender.ward = customerInfo.value.ward || '';
    form.sender.street_address = customerInfo.value.street_address || '';
    form.sender.address_detail = customerInfo.value.address_detail || '';
    form.sender.old_province = customerInfo.value.old_province || '';

    // Đồng bộ hóa ngược code tỉnh / xã người gửi để hiển thị đúng el-select
    if (form.sender.province) {
      const cleanProv = form.sender.province.replace(/^(Tỉnh|Thành phố|TP\.)\s+/i, '').trim().toLowerCase();
      const provObj = senderProvinces.value.find(p => {
        const pName = p.FullName.replace(/^(Tỉnh|Thành phố|TP\.)\s+/i, '').trim().toLowerCase();
        return pName === cleanProv;
      });
      if (provObj) {
        selectedSenderProvinceCode.value = provObj.Code;
        availableSenderWards.value = provObj.Wards || [];
        
        if (form.sender.ward) {
          const cleanWard = form.sender.ward.trim().toLowerCase();
          const wardObj = availableSenderWards.value.find(w => w.FullName.trim().toLowerCase() === cleanWard);
          if (wardObj) {
            selectedSenderWardCode.value = wardObj.Code;
          }
        }
      }
    }
  } catch (err) {
    console.error('Không thể tải thông tin hồ sơ khách hàng', err);
    customerInfo.value = {
      customer_code: 'REG-PENDING',
      phone_number: activeUser.phone_number || 'Chưa cập nhật',
      email: activeUser.email || '',
      address_detail: '',
      province: '',
      ward: '',
      street_address: '',
      old_province: ''
    };
  }

  const isProfileComplete = 
    customerInfo.value.phone_number &&
    customerInfo.value.province &&
    customerInfo.value.ward &&
    customerInfo.value.address_detail;

  if (!isProfileComplete) {
    try {
      await ElMessageBox.confirm(
        'Tài khoản của bạn chưa cập nhật đầy đủ thông tin địa chỉ lấy hàng (Số điện thoại, Tỉnh/Thành, Quận/Huyện, Địa chỉ chi tiết). Vui lòng cập nhật đầy đủ thông tin tài khoản để tiếp tục tạo đơn.',
        'Cảnh báo: Thiếu thông tin địa chỉ lấy hàng',
        {
          confirmButtonText: 'Cập nhật ngay',
          cancelButtonText: 'Hủy',
          type: 'warning',
          showClose: false,
          closeOnClickModal: false,
          closeOnPressEscape: false
        }
      );
      router.push('/customer/profile');
    } catch (e) {
      router.push('/customer/dashboard');
    }
    return;
  }

  fetchAvailableServices();
  fetchHubs();

  setTimeout(() => {
    isLoaded.value = true;
    isDirty.value = false;
  }, 500);
});

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>
<style scoped src="./CustomerPortal.css"></style>
