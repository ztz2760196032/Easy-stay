import { Button, Layout } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuth';

const { Header, Content } = Layout;

export default function MerchantLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#1677ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>易宿酒店 商户端</div>
        <div>
          {user?.username}
          <Button
            type="link"
            style={{ color: '#fff', marginLeft: 12 }}
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            退出登录
          </Button>
        </div>
      </Header>
      <Content style={{ padding: 24, background: '#f0f2f5' }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
