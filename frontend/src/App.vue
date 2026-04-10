<template>
  <el-config-provider :locale="vi">
    <router-view />
  </el-config-provider>
</template>

<script setup>
import vi from 'element-plus/es/locale/lang/vi';
</script>

<style>
/* CSS Reset / Global Styles handled in style.css */
</style>
