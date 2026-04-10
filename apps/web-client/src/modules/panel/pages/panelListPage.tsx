import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Select, Card, Badge, Button, Empty, Popconfirm, message } from 'antd';
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
            placeholder="搜索标题"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className={styles.searchInput}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className={styles.statusSelect}
            options={[
              { label: '全部', value: 'all' },
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
            <Card
              key={panel.id}
              className={styles.card}
              hoverable
              onClick={() => navigate(`/panel/${panel.id}`)}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>{panel.title || '未命名面板'}</span>
                <Badge
                  status={panel.status === PanelStatus.PUBLISHED ? 'success' : 'default'}
                  text={panel.status === PanelStatus.PUBLISHED ? '已发布' : '草稿'}
                />
              </div>
              <div className={styles.cardMeta}>
                创建时间：{new Date(panel.createdAt).toLocaleDateString()}
              </div>
              <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
                <Button size="small" onClick={() => handleStatusToggle(panel)}>
                  {panel.status === PanelStatus.DRAFT ? '发布' : '撤销'}
                </Button>
                <Popconfirm
                  title="确认删除"
                  onConfirm={() => handleDelete(panel.id)}
                >
                  <Button size="small" danger icon={<Trash2 size={14} />} />
                </Popconfirm>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
