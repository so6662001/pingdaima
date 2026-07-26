/* 演示数据：星链数科 · 研发中心（虚构） */
window.DATA = {
  org: { name: '星链数科', center: '研发中心', head: '沈知远' },

  members: [
    { id: 'u1', name: '沈知远', role: '研发中心总裁', team: '中心管理部' },
    { id: 'u2', name: '周雅', role: '产品总监', team: '产品部' },
    { id: 'u3', name: '陈立', role: '首席架构师', team: '技术架构组' },
    { id: 'u4', name: '李思远', role: '后端负责人', team: '交易平台组' },
    { id: 'u5', name: '王倩', role: '前端负责人', team: '前端体验组' },
    { id: 'u6', name: '赵鹏', role: '测试经理', team: '质量保障部' },
    { id: 'u7', name: '孙悦', role: '产品经理', team: '产品部' },
    { id: 'u8', name: '何俊', role: '高级研发工程师', team: '交易平台组' },
    { id: 'u9', name: '林小满', role: 'SRE 负责人', team: '基础架构组' },
    { id: 'u10', name: '郑宇', role: '研发工程师', team: '风控算法组' },
    { id: 'u11', name: '吴敏', role: '测试工程师', team: '质量保障部' },
    { id: 'u12', name: '徐磊', role: '项目经理', team: '项目管理办公室' }
  ],

  products: ['统一支付网关', '商户运营中心', '智能风控平台', '开放能力平台', '数据资产中台'],

  teams: ['交易平台组', '风控算法组', '前端体验组', '基础架构组', '质量保障部', '产品部'],

  statusColor: {
    '待规划': 'gray', '规划中': 'purple', '评审中': 'orange', '待开发': 'gray',
    '开发中': 'blue', '联调中': 'blue', '测试中': 'orange', '待发布': 'purple',
    '已发布': 'green', '已完成': 'green', '已关闭': 'gray', '已挂起': 'gray', '风险': 'red'
  },

  weekLabels: ['W22', 'W23', 'W24', 'W25', 'W26', 'W27', 'W28', 'W29', 'W30'],
  monthLabels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月']
};
