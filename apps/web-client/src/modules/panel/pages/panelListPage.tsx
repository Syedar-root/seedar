import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Select, Empty, Popconfirm } from 'antd';
import { Trash2 } from 'lucide-react';
import { usePanels, useUpdatePanel, useDeletePanel } from '#pkg/seedar/ui-react';
import { PanelStatus } from '#pkg/seedar/types';
import styles from './styles/panelList.module.scss';

export const PanelListPage = () => {
  const navigate = useNavigate();
  const { data: panels, isLoading } = usePanels();
  const updatePanel = useUpdatePanel();
  const deletePanel = useDeletePanel();

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<PanelStatus | 'all'>('all');

  // 过滤逻辑
  const filteredPanels = useMemo(() => {
    return panels?.filter((panel) => {
      const matchTitle =
        !searchText || panel.title?.toLowerCase().includes(searchText.toLowerCase());
      const matchStatus = statusFilter === 'all' || panel.status === statusFilter;
      return matchTitle && matchStatus;
    }) ?? [];
  }, [panels, searchText, statusFilter]);

  const handleStatusToggle = (panel: { id: string; status: PanelStatus }) => {
    const newStatus =
      panel.status === PanelStatus.DRAFT ? PanelStatus.PUBLISHED : PanelStatus.DRAFT;
    updatePanel.mutate({ id: panel.id, data: { status: newStatus } });
  };

  const handleDelete = (id: string) => {
    deletePanel.mutate(id);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>面板列表</h1>
        <div className={styles.filters}>
          <Input.Search
            placeholder="搜索面板"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className={styles.searchInput}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className={styles.statusSelect}
            options={[
              { label: '全部状态', value: 'all' },
              { label: '草稿', value: PanelStatus.DRAFT },
              { label: '已发布', value: PanelStatus.PUBLISHED },
            ]}
          />
        </div>
      </header>

      {isLoading ? (
        <div>加载中...</div>
      ) : filteredPanels.length === 0 ? (
        <Empty description="暂无面板" />
      ) : (
        <div className={styles.grid}>
          {filteredPanels.map((panel) => (
            <article
              key={panel.id}
              className={styles.card}
              onClick={() => navigate(`/panel/${panel.id}`)}
            >
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>{panel.title || '未命名面板'}</h2>
                <span
                  className={`${styles.badge} ${
                    panel.status === PanelStatus.PUBLISHED ? styles.published : styles.draft
                  }`}
                >
                  {panel.status === PanelStatus.PUBLISHED ? '已发布' : '草稿'}
                </span>
              </div>
              <div className={styles.cardMeta}>
                创建于 {new Date(panel.createdAt).toLocaleDateString()}
              </div>
              <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
                <button
                  className={styles.btnGhost}
                  onClick={() => handleStatusToggle(panel)}
                  type="button"
                >
                  {panel.status === PanelStatus.DRAFT ? '发布' : '撤销'}
                </button>
                <Popconfirm
                  title="确认删除该面板？"
                  onConfirm={() => handleDelete(panel.id)}
                  okText="确认"
                  cancelText="取消"
                >
                  <button className={`${styles.btnGhost} ${styles.btnDanger}`} type="button">
                    <Trash2 size={14} />
                  </button>
                </Popconfirm>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
