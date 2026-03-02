import { Button, Card, DatePicker, Form, Input, InputNumber, List, message, Rate } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useHotelStore } from '../../store/useHotelStore';
import type { Hotel, RoomType } from '../../types/hotel';

type FormValues = {
  nameZh: string;
  nameEn?: string;
  city: string;
  address: string;
  starLevel: number;
  openTime?: dayjs.Dayjs;
  nearby?: string;
  discounts?: string;
  imagesText?: string;
  roomTypes?: Array<Pick<RoomType, 'name' | 'price' | 'discount'>>;
};

function parseImages(text: string | undefined) {
  if (!text) return [];
  return text
    .split(/[\r\n,，]+/g)
    .map((s) => s.trim())
    .map((s) => s.replace(/[，,。；;]+$/g, ''))
    .filter(Boolean);
}

export default function HotelForm() {
  const [form] = Form.useForm<FormValues>();
  const [editing, setEditing] = useState<Hotel | null>(null);

  const merchantHotels = useHotelStore((s) => s.merchantHotels);
  const fetchMerchantHotels = useHotelStore((s) => s.fetchMerchantHotels);
  const createHotel = useHotelStore((s) => s.createHotel);
  const updateMerchantHotel = useHotelStore((s) => s.updateMerchantHotel);

  useEffect(() => {
    void fetchMerchantHotels();
  }, [fetchMerchantHotels]);

  const initial = useMemo<FormValues>(
    () => ({
      nameZh: '',
      city: '',
      address: '',
      starLevel: 4,
      roomTypes: [{ name: '标准房', price: 399, discount: 1 }],
    }),
    []
  );

  async function onFinish(values: FormValues) {
    const payload = {
      nameZh: values.nameZh,
      nameEn: values.nameEn,
      city: values.city,
      address: values.address,
      starLevel: values.starLevel,
      openTime: values.openTime ? values.openTime.format('YYYY-MM-DD') : undefined,
      nearby: values.nearby,
      discounts: values.discounts,
      images: parseImages(values.imagesText),
      roomTypes: (values.roomTypes || []).map((r, idx) => ({
        id: `${Date.now()}-${idx}`,
        name: r.name,
        price: r.price,
        discount: r.discount,
      })),
    };

    try {
      if (editing) {
        await updateMerchantHotel(editing.id, payload);
        message.success('修改成功，已重新提交审核');
      } else {
        await createHotel(payload);
        message.success('提交成功，等待审核');
      }
      setEditing(null);
      form.resetFields();
      form.setFieldsValue(initial);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '提交失败');
    }
  }

  function startEdit(hotel: Hotel) {
    setEditing(hotel);
    form.setFieldsValue({
      nameZh: hotel.nameZh,
      nameEn: hotel.nameEn,
      city: hotel.city,
      address: hotel.address,
      starLevel: hotel.starLevel,
      openTime: hotel.openTime ? dayjs(hotel.openTime) : undefined,
      nearby: hotel.nearby,
      discounts: hotel.discounts,
      imagesText: (hotel.images || []).join('\n'),
      roomTypes: (hotel.roomTypes || []).map((r) => ({ name: r.name, price: r.price, discount: r.discount })),
    });
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
      <Card title={editing ? `编辑酒店：${editing.nameZh}` : '新增酒店'}>
        <Form<FormValues> form={form} layout="vertical" onFinish={onFinish} initialValues={initial}>
          <Form.Item label="酒店中文名" name="nameZh" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="酒店英文名（可选）" name="nameEn">
            <Input />
          </Form.Item>
          <Form.Item label="城市" name="city" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="地址" name="address" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="星级" name="starLevel" rules={[{ required: true }]}>
            <Rate />
          </Form.Item>
          <Form.Item label="开业时间（可选）" name="openTime">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="附近信息（可选）" name="nearby">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="优惠信息（可选）" name="discounts">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.List name="roomTypes">
            {(fields, { add, remove }) => (
              <div style={{ display: 'grid', gap: 12 }}>
                {fields.map((field) => (
                  <Card key={field.key} size="small" title={`房型 ${field.name + 1}`}>
                    <Form.Item {...field} label="房型名称" name={[field.name, 'name']} rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                    <Form.Item {...field} label="价格" name={[field.name, 'price']} rules={[{ required: true }]}>
                      <InputNumber style={{ width: '100%' }} min={0} />
                    </Form.Item>
                    <Form.Item {...field} label="折扣（0.1-1，可选）" name={[field.name, 'discount']}>
                      <InputNumber style={{ width: '100%' }} min={0.1} max={1} step={0.1} />
                    </Form.Item>
                    <Button danger onClick={() => remove(field.name)}>
                      删除房型
                    </Button>
                  </Card>
                ))}
                <Button onClick={() => add()} type="dashed">
                  添加房型
                </Button>
              </div>
            )}
          </Form.List>

          <Form.Item label="酒店图片 URL（多行或逗号分隔，可选）" name="imagesText">
            <Input.TextArea rows={3} placeholder="https://...\nhttps://..." />
          </Form.Item>

          <div style={{ display: 'flex', gap: 12 }}>
            <Button htmlType="submit" type="primary">
              {editing ? '保存' : '提交审核'}
            </Button>
            {editing ? (
              <Button
                onClick={() => {
                  setEditing(null);
                  form.resetFields();
                  form.setFieldsValue(initial);
                }}
              >
                取消
              </Button>
            ) : null}
          </div>
        </Form>
      </Card>

      <Card title="我的酒店">
        <List
          dataSource={merchantHotels}
          rowKey="id"
          renderItem={(hotel) => (
            <List.Item
              actions={[
                <Button key="edit" onClick={() => startEdit(hotel)}>
                  编辑
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={`${hotel.nameZh}（${hotel.city}）`}
                description={`状态：${hotel.status}${hotel.rejectReason ? `，原因：${hotel.rejectReason}` : ''}`}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

