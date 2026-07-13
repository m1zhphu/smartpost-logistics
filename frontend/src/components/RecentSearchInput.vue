<template>
  <el-popover
    placement="bottom-start"
    :width="props.popoverWidth === 'auto' || props.popoverWidth === '100%' ? dynamicWidth : props.popoverWidth"
    trigger="hover"
    @show="handleShow"
  >
    <template #reference>
      <div ref="inputWrapperRef" style="width: 100%">
        <el-input
          v-bind="$attrs"
          v-model="inputValue"
          @keyup.enter="handleEnter"
        >
        <template v-for="(slot, name) in $slots" :key="name" #[name]>
          <slot :name="name"></slot>
        </template>
        </el-input>
      </div>
    </template>

    <div v-if="searches.length > 0" class="recent-search-container" @mousedown.prevent>
      <div class="recent-search-header">
        <span class="title">Tìm kiếm gần đây:</span>
        <el-button type="danger" link size="small" @click.stop="clearAll">Xóa tất cả</el-button>
      </div>
      <div class="recent-search-tags">
        <el-tag
          v-for="search in searches"
          :key="search"
          closable
          effect="plain"
          type="info"
          size="small"
          class="search-tag"
          @close.stop="removeSearch(search)"
          @click.stop="selectSearch(search)"
        >
          {{ search }}
        </el-tag>
      </div>
    </div>
    <div v-else class="recent-search-empty" @mousedown.prevent>
      <span class="text-muted">Chưa có lịch sử tìm kiếm</span>
    </div>
  </el-popover>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRecentSearch } from '@/composables/useRecentSearch';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  storageKey: {
    type: String,
    default: 'recentSearches_public'
  },
  popoverWidth: {
    type: [Number, String],
    default: 'auto'
  }
});

const emit = defineEmits(['update:modelValue', 'search']);

const inputValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const { searches, saveSearch, removeSearch, clearAll } = useRecentSearch(props.storageKey);

const inputWrapperRef = ref(null);
const dynamicWidth = ref(300);

const handleShow = () => {
  if (inputWrapperRef.value) {
    const width = inputWrapperRef.value.offsetWidth;
    dynamicWidth.value = width > 100 ? width : 300;
  }
};

const handleEnter = () => {
  if (inputValue.value) {
    saveSearch(inputValue.value);
  }
  // To close popover programmatically on enter if needed, but with hover it closes on mouseout
};

const selectSearch = (search) => {
  inputValue.value = search;
  saveSearch(search);
  emit('search', search);
};

defineExpose({
  saveSearch: (val) => saveSearch(val || inputValue.value)
});
</script>

<style scoped>
.recent-search-container {
  padding: 4px;
}
.recent-search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.recent-search-header .title {
  font-size: 13px;
  color: #666;
  font-weight: 600;
}
.recent-search-tags {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  max-height: 150px;
  overflow-y: auto;
  padding-right: 4px;
}
.recent-search-tags::-webkit-scrollbar {
  width: 6px;
}
.recent-search-tags::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 4px;
}
.recent-search-tags::-webkit-scrollbar-track {
  background: transparent;
}
.search-tag {
  cursor: pointer;
  max-width: 100%;
  height: auto;
  white-space: normal;
  padding: 4px 8px;
  line-height: 1.4;
  word-break: break-all;
}
.search-tag:hover {
  background-color: #f0f2f5;
}
.recent-search-empty {
  padding: 12px 0;
  text-align: center;
  font-size: 13px;
  color: #999;
}
.text-muted {
  color: #999;
}
</style>
