import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Empty, Popconfirm } from 'antd';
import { Plus, Trash2 } from 'lucide-react';
import { usePanels, useUpdatePanel, useDeletePanel } from '#pkg/seedar/ui-react';
import { PanelStatus } from '#pkg/seedar/types';
import { Select } from '@/core/components/ui/Select';
import styles from './styles/panelList.module.scss';

export const PanelListPage = () => {
  const navigate = useNavigate();
  const { data: panels, isLoading } = usePanels();
  const updatePanel = useUpdatePanel();
  const deletePanel = useDeletePanel();

  const [searchInput, setSearchInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (!isComposing) {
      setSearchQuery(value);
    }
  };

  const handleSearchCompositionStart = () => {
    setIsComposing(true);
  };

  const handleSearchCompositionEnd = (value: string) => {
    setIsComposing(false);
    setSearchInput(value);
    setSearchQuery(value);
  };

  const handleCreatePanel = () => {
    navigate('/panel/create');
  };

  // 过滤逻辑
  const filteredPanels = useMemo(() => {
    return panels?.filter((panel) => {
      const matchTitle =
        !searchQuery || panel.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = !statusFilter || panel.status === statusFilter;
      return matchTitle && matchStatus;
    }) ?? [];
  }, [panels, searchQuery, statusFilter]);

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
        <h1 className={styles.title}>面板管理</h1>
        <button className={styles.createButton} onClick={handleCreatePanel}>
          <Plus size={16} />
          新建面板
        </button>
      </header>

      <div className={styles.filters}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="搜索面板..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          onCompositionStart={handleSearchCompositionStart}
          onCompositionEnd={(e) => {
            handleSearchCompositionEnd((e.target as HTMLInputElement).value);
          }}
        />
        <Select
          value={statusFilter}
          onChange={(val) => setStatusFilter(val ?? '')}
          label="状态"
          placeholder="全部状态"
          options={[
            { label: '草稿', value: PanelStatus.DRAFT },
            { label: '已发布', value: PanelStatus.PUBLISHED },
          ]}
        />
      </div>

      <main className={styles.content}>
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
      </main>
    </div>
  );
};
