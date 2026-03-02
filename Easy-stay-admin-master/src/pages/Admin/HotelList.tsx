import { Button, Descriptions, Divider, Input, Modal, Table, Tag, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useHotelStore } from '../../store/useHotelStore';
import type { Hotel, HotelStatus } from '../../types/hotel';

export default function HotelListAdmin() {
  const hotels = useHotelStore((s) => s.adminHotels);
  const loading = useHotelStore((s) => s.loading);
  const error = useHotelStore((s) => s.error);
  const fetchAdminHotels = useHotelStore((s) => s.fetchAdminHotels);
  const auditHotel = useHotelStore((s) => s.auditHotel);
  const publishHotel = useHotelStore((s) => s.publishHotel);
  const offlineHotel = useHotelStore((s) => s.offlineHotel);
  const setStatusUnsafe = useHotelStore((s) => s.setStatusUnsafe);

  const [rejecting, setRejecting] = useState<Hotel | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detail, setDetail] = useState<Hotel | null>(null);

  useEffect(() => {
    void fetchAdminHotels();
  }, [fetchAdminHotels]);

  useEffect(() => {
    if (error) message.error(error);
  }, [error]);

  const columns = useMemo(
    () => [
      { title: '酒店', dataIndex: 'nameZh', key: 'nameZh' },
      { title: '城市', dataIndex: 'city', key: 'city' },
      { title: '商户ID', dataIndex: 'merchantId', key: 'merchantId' },
      { title: '星级', dataIndex: 'starLevel', key: 'starLevel' },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (s: HotelStatus) => (
          <Tag color={s === 'published' ? 'green' : s === 'rejected' ? 'red' : s === 'offline' ? 'default' : 'orange'}>{s}</Tag>
        ),
      },
      {
        title: '操作',
        key: 'actions',
        render: (_: unknown, record: Hotel) => (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {record.status === 'auditing' ? (
              <>
                <Button size="small" type="link" onClick={() => void auditHotel(record.id, true)}>
                  通过
                </Button>
                <Button size="small" type="link" danger onClick={() => setRejecting(record)}>
                  拒绝
                </Button>
              </>
            ) : null}
            {record.status === 'approved' ? (
              <Button size="small" type="link" onClick={() => void publishHotel(record.id)}>
                发布上线
              </Button>
            ) : null}
            {record.status === 'published' ? (
              <Button size="small" type="link" danger onClick={() => void offlineHotel(record.id)}>
                下线
              </Button>
            ) : null}
            {record.status === 'offline' ? (
              <Button size="small" type="link" onClick={() => void setStatusUnsafe(record.id, 'approved')}>
                恢复（回到已通过）
              </Button>
            ) : null}
            <Button size="small" type="link" onClick={() => setDetail(record)}>
              详情
            </Button>
          </div>
        ),
      },
    ],
    [auditHotel, offlineHotel, publishHotel, setStatusUnsafe]
  );

  return (
    <div>
      <h2>酒店审核与上下线</h2>
      <Button onClick={() => void fetchAdminHotels()} style={{ marginBottom: 12 }}>
        刷新
      </Button>
      <Table columns={columns} dataSource={hotels} rowKey="id" loading={loading} />

      <Modal
        title={rejecting ? `拒绝：${rejecting.nameZh}` : '拒绝'}
        open={!!rejecting}
        onCancel={() => {
          setRejecting(null);
          setRejectReason('');
        }}
        onOk={async () => {
          if (!rejecting) return;
          await auditHotel(rejecting.id, false, rejectReason);
          setRejecting(null);
          setRejectReason('');
        }}
      >
        <Input.TextArea rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="请输入拒绝原因" />
      </Modal>

      <Modal title={detail ? detail.nameZh : '详情'} open={!!detail} onCancel={() => setDetail(null)} footer={null} width={900}>
        {detail ? (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="酒店中文名">{detail.nameZh}</Descriptions.Item>
              <Descriptions.Item label="酒店英文名">{detail.nameEn || '-'}</Descriptions.Item>
              <Descriptions.Item label="城市">{detail.city}</Descriptions.Item>
              <Descriptions.Item label="地址">{detail.address}</Descriptions.Item>
              <Descriptions.Item label="星级">{detail.starLevel}</Descriptions.Item>
              <Descriptions.Item label="状态">{detail.status}</Descriptions.Item>
              {detail.rejectReason ? (
                <Descriptions.Item label="拒绝原因" span={2}>
                  {detail.rejectReason}
                </Descriptions.Item>
              ) : null}
            </Descriptions>
            <Divider>房型</Divider>
            <Table
              rowKey="id"
              pagination={false}
              dataSource={detail.roomTypes || []}
              columns={[
                { title: '名称', dataIndex: 'name' },
                { title: '价格', dataIndex: 'price' },
                { title: '折扣', dataIndex: 'discount' },
              ]}
            />
            {detail.images && detail.images.length > 0 ? (
              <>
                <Divider>酒店图片</Divider>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {detail.images.map((src, idx) => (
                    <img key={idx} src={src} alt={`hotel-${idx}`} style={{ width: 160, height: 110, objectFit: 'cover', borderRadius: 8 }} />
                  ))}
                </div>
              </>
            ) : null}
          </>
        ) : null}
      </Modal>
    </div>
  );
}

