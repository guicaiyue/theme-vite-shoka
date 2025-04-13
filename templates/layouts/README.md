# Halo Theme Shoka 模板组件说明

## 组件结构

```
layouts/
├── head/           # 头部相关组件
│   └── meta.html   # SEO meta标签组件
├── macro/          # 通用宏组件
│   ├── breadcrumb.html      # 面包屑导航
│   ├── data-processor.html  # 数据处理
│   └── list-processor.html  # 列表处理
├── partials/       # 页面部分组件
├── post/           # 文章相关组件
└── common/         # 公共组件
```

## 组件使用说明

### 1. Meta组件 (meta.html)

用于处理页面的SEO相关标签：

```html
<!-- 文章页使用 -->
<th:block th:replace="~{layouts/head/meta :: post(${post})}">

<!-- 列表页使用 -->
<th:block th:replace="~{layouts/head/meta :: list('标题', '描述')}">
```

### 2. 面包屑组件 (breadcrumb.html)

用于显示页面导航路径：

```html
<!-- 文章页使用 -->
<th:block th:replace="~{layouts/macro/breadcrumb :: post(${post})}">

<!-- 分类页使用 -->
<th:block th:replace="~{layouts/macro/breadcrumb :: category(${category}, ${count})}">
```

### 3. 数据处理组件 (data-processor.html)

用于统一处理各类数据：

```html
<!-- 处理文章数据 -->
<th:block th:replace="~{layouts/macro/data-processor :: process(${post}, 'post')}">

<!-- 处理分类数据 -->
<th:block th:replace="~{layouts/macro/data-processor :: process(${category}, 'category')}">
```

### 4. 列表处理组件 (list-processor.html)

用于处理各类列表数据：

```html
<!-- 处理文章列表 -->
<th:block th:replace="~{layouts/macro/list-processor :: process(${posts}, 'posts')}">

<!-- 处理分类列表 -->
<th:block th:replace="~{layouts/macro/list-processor :: process(${categories}, 'categories')}">
```

## 最佳实践

1. **组件复用**
   - 优先使用现有组件
   - 保持组件的单一职责
   - 避免重复代码

2. **数据处理**
   - 使用data-processor统一处理数据
   - 保持数据结构的一致性
   - 注意数据的可选性处理

3. **模板结构**
   - 保持清晰的层级结构
   - 使用合适的HTML语义标签
   - 保持代码的可读性

4. **性能优化**
   - 合理使用th:with缓存计算结果
   - 避免重复的数据处理
   - 注意列表循环的性能

## 注意事项

1. 所有组件都支持Thymeleaf的标准方言
2. 注意数据的空值处理
3. 保持组件的独立性和可复用性
4. 遵循HTML5语义化标准
5. 注意SEO最佳实践 