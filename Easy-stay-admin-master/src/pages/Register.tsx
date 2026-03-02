import { Button, Card, Form, Input, Select, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuth';
import type { Role } from '../types/hotel';

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const error = useAuthStore((s) => s.error);

  async function onFinish(values: { username: string; password: string; role: Role }) {
    const ok = await register(values.username, values.password, values.role);
    if (!ok) {
      message.error(error || '注册失败');
      return;
    }
    message.success('注册成功');
    const user = useAuthStore.getState().user;
    navigate(user?.role === 'admin' ? '/admin' : '/merchant');
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card title="注册账号" style={{ width: 420 }}>
        <Form layout="vertical" onFinish={onFinish} initialValues={{ role: 'merchant' }}>
          <Form.Item label="用户名" name="username" rules={[{ required: true }]}>
            <Input autoComplete="username" />
          </Form.Item>
          <Form.Item label="密码（至少 6 位）" name="password" rules={[{ required: true, min: 6 }]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item label="角色" name="role" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'merchant', label: '商户' },
                { value: 'admin', label: '管理员' },
              ]}
            />
          </Form.Item>
          <Button htmlType="submit" type="primary" block>
            注册
          </Button>
          <Button type="link" onClick={() => navigate('/login')} block>
            返回登录
          </Button>
        </Form>
      </Card>
    </div>
  );
}

